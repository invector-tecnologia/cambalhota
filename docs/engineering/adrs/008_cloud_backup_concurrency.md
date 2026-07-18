# ADR 008: Cloud Backup Integration and Concurrency

**Status:** Implementado

## Contexto
O Agente de Produto idealizou uma solução de UX/UI na interface TUI (`app.nim`) para permitir o upload (`[U]`) e o download (`[D]`) de backups/dumps diretamente de um armazenamento em nuvem. A interface atual implementa o comportamento visual usando variáveis simuladas (`isUploading`, `isDownloading` e `progressTimer`), o que demanda a criação de uma infraestrutura real de integração e gerenciamento assíncrono para que as operações de rede (I/O pesadas e longas) não bloqueiem a thread principal da TUI.

## Decisão
1. **Padrão de Integração de Rede (Cloud Integration):**
   - Implementaremos um cliente genérico compatível com o protocolo S3 utilizando a biblioteca padrão HTTP do Nim (`std/httpclient` ou `puppy`). 
   - A autenticação utilizará o padrão AWS Signature V4 gerado nativamente no Nim, garantindo suporte não apenas para AWS S3, mas também para soluções como MinIO, Cloudflare R2, DigitalOcean Spaces e Google Cloud Storage (via interoperabilidade S3).
   - O uso de uma solução agnóstica via chamadas HTTP evita o "vendor lock-in" pesado de SDKs específicos e aproveita a infraestrutura leve e compilada do Nim.

2. **Concorrência e Multithreading:**
   - Como a TUI renderiza a 60fps+ no terminal através da função de polling `pollEvent(50)`, qualquer interrupção via rede congelaria a tela do usuário.
   - Utilizaremos as primitivas nativas do Nim de `Thread[T]` e `Channel[T]` (especificamente `system.Channel` adaptado para o arc/orc memory model).
   - Ao teclar `[U]` ou `[D]`, a Thread principal (TUI) dispara o processo de I/O em uma **Worker Thread**.
   - A Worker Thread utilizará HTTP Streaming (com chunks limitados na memória) para ler arquivos criptografados de backup e enviá-los ao cloud bucket.
   - Em cada iteração de chunk, a Worker Thread envia uma mensagem não-bloqueante (`Channel.trySend`) para a TUI contendo o status de progresso (ex: `bytesEnviados`, `totalBytes`, `stRunning`, `stError`).

3. **Integração na TUI (`app.nim`):**
   - O laço principal em `runTui()` fará a chamada `progressChannel.tryRecv()` antes da renderização.
   - O objeto de estado visual (progresso e strings de notificação) será alimentado através dessas mensagens vindas do canal, substituindo o simulador de `progressTimer += 5`.
   - Isso permite que a interface reaja em tempo real ao tráfego de rede sem delays de repintura do terminal.

## Trade-offs
- **Complexidade de Threads:** Operar com Threads e Channels no Nim ORC exige que os tipos passados sejam `Sendable` (isolados da thread original). Não poderemos passar referências abertas de rede, limitando a comunicação ao simples transporte de status (strings, integers e enums).
- **Abstração S3 Nativa:** Escrever ou utilizar bibliotecas enxutas para gerar a assinatura HMAC-SHA256 do AWS SigV4 em Nim demanda desenvolvimento ou integração de bibliotecas de criptografia.
- **Vantagem:** A ausência de SDKs monstruosos como os de Python/Node para AWS tornam o binário do Cambalhota ultrarrápido, minúsculo e sem dependências dinâmicas no deploy.

## Consequências
- A experiência do usuário ("UX/UI non-blocking") pensada em Produto passa a ser 100% verdadeira no backend: o terminal permanecerá interativo permitindo que o usuário navegue enquanto seu dump sobe para a nuvem.
- Cancelamentos amigáveis deverão ser suportados enviando sinais (`Cancellation Token` ou booleano atômico) para abortar a thread de rede, caso o usuário queira desistir no meio de um upload.
- A base técnica servirá de fundação sólida caso no futuro o projeto integre WebDAV, FTP ou Google Drive nativo.
