# ADR 010: QA Resilience Mitigations

**Status**: Implementado
## Contexto
O Agente QA executou uma bateria sofisticada de testes de segurança, performance e concorrência no Cambalhota. Foram identificados 4 pontos críticos (Blind Spots) que podem levar a instabilidade, travamento ou vulnerabilidades no sistema:
1. **Buffer overflow na TUI**: Injeção de caracteres excessivos ou maliciosos em campos de input.
2. **Pânico na Worker Thread**: Falhas na descriptografia de arquivos corrompidos derrubam a thread ao invés de tratarem o erro de forma isolada.
3. **Deadlock de rede no Módulo Cloud S3**: Travamento da comunicação devido ao uso de `httpclient` sem configuração de timeout estrito em situações de rede intermitente.
4. **Picos de alocação de memória**: Envio excessivo de mensagens de progresso via Channels entre as threads, causando alta alocação (sem *debouncing*).

## Decisão Técnica e Implementação (Nim)

### 1. Prevenção de Buffer Overflow na TUI (`src/tui/app.nim` e similares)
- **Implementação**: Limitar rigorosamente o tamanho das strings nos campos de input do *Tatui* / *Illwill*. 
- **Detalhes**:
  - Validar o `len` da string de input antes de concatenar novos caracteres. Se exceder um `MAX_INPUT_LENGTH` (ex: 256 caracteres para caminhos ou senhas), o input extra deve ser descartado.
  - Sanitizar a entrada para ignorar caracteres de controle não permitidos.

### 2. Tolerância a Falhas na Worker Thread (`src/core/restore.nim` ou `src/core/crypto.nim`)
- **Implementação**: Substituir chamadas que podem gerar pânico (como acesso indevido ou falha criptográfica) por blocos `try ... except CatchableError`.
- **Detalhes**:
  - Quando o módulo de criptografia detectar corrupção de arquivo (falha de autenticação GCM ou padding inválido), a worker thread não deve falhar criticamente (`panic`).
  - O erro deve ser empacotado em uma estrutura de mensagem (`BackupEvent` ou similar) com status de Erro e enviado de volta à Main Thread via Channel, permitindo que a TUI exiba a falha graciosamente e continue operando.

### 3. Timeout Estrito e Resiliência de Rede (`src/core/cloud.nim`)
- **Implementação**: Configurar timeouts explícitos no cliente HTTP e implementar *Retries*.
- **Detalhes**:
  - Ao instanciar `newHttpClient()` ou `newAsyncHttpClient()`, definir obrigatoriamente o parâmetro `timeout` (ex: 15000 a 30000 ms).
  - Envolver as chamadas de rede para o S3 em blocos de tentativa com *Exponential Backoff*. Caso ocorra um `TimeoutError`, o sistema retenta até um limite máximo antes de falhar a operação de forma segura (notificando via Channel).

### 4. *Debouncing* de Mensagens em Channels (`src/core/worker.nim` / `src/core/progress.nim`)
- **Implementação**: Agrupar (*batching*) ou aplicar *debouncing* no envio de atualizações de progresso para a Main Thread.
- **Detalhes**:
  - Em invés de enviar uma string para o `Channel` a cada byte lido ou bloco pequeno transferido, o worker deve armazenar o tempo da última atualização (usando `std/times` e `cpuTime`).
  - Enviar mensagens de atualização apenas se a diferença de tempo superar um limiar (ex: 100ms) ou se a transferência for concluída.
  - O conteúdo da mensagem não deve ser uma `string` montada a cada iteração, mas sim um objeto/tupla leve (`tuple[bytesRead: int, totalBytes: int]`), deixando a formatação de string (`"50% concluído"`) para a Main Thread (TUI), o que elimina as alocações repetitivas no worker.

## Consequências e Trade-offs
- **Positivas**: 
  - Maior resiliência e estabilidade do aplicativo.
  - Redução drástica do consumo de CPU e RAM durante operações pesadas devido à mitigação de overhead do Channel.
  - TUI à prova de quebras por "Fat Fingers" ou inputs mal-intencionados.
- **Negativas / Trade-offs**: 
  - A TUI perderá uma precisão microscópica nas barras de progresso (atualizando a cada 100ms em vez de continuamente), o que é imperceptível para o usuário humano, mas muda a granularidade real.
  - A complexidade do código de rede aumentará levemente devido à lógica de *retry* e *backoff*.
