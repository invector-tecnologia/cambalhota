# Relatório de Garantia de Qualidade e Resiliência (QA) - Cambalhota

## 1. Resumo Executivo
Este relatório detalha a bateria de testes de aceitação e exploratórios conduzidos no projeto Cambalhota, com foco especial na robustez da interface TUI (Tatuí), comportamento frente a corrupção de dados (restore) e estabilidade de concorrência no novo motor de Cloud assíncrono.
Todos os testes nativos (`nimble test`) passaram com sucesso (100% dos testes implementados estão operacionais), atestando a qualidade do build atual.

## 2. Cobertura de Testes Atual
A suíte de testes (`nimble test`) cobriu com êxito:
- **Cloud Engine (`t_cloud_backup`, `t_cloud_credentials`)**: Upload e download assíncrono (caminho feliz), tratamento de falha de rede simulada, chaves inválidas, cancelamento, criação e exclusão de provedores S3.
- **Migration Engine (`tmigrations`)**: Scan, ordenação, checksum e injeção transacional.
- **Workers (Extract & Restore)**: Processamento, compressão, encriptação e tratamento de erros de schema (garantia de uso do schema `Cambalhota` ao invés de `public`).
- **Database & System Checks (`tconfig`, `tchecks`)**: Validação de ambiente e configurações mandatórias.

## 3. Testes Exploratórios de Altíssimo Nível (Edge Cases) e Pontos Cegos (Blind Spots)

### 3.1. Injeção de Caracteres e Limites TUI
- **Ponto Cego Identificado:** O Tatuí reage bem a inputs padrão, mas em testes de stress, a colagem (*paste*) massiva de strings (ex: 10MB) ou a injeção de Unicode complexo (`👾`, sequências nulas) pode estressar o buffer de renderização e causar degradação de FPS ou *buffer overflow* lógico.
- **Mitigação:** Implementar truncamento estrito de comprimento máximo no componente Input do Tatuí e filtrar *payloads* em níveis de ASCII/UTF-8 seguros.

### 3.2. Restore com Dumps Corrompidos
- **Ponto Cego Identificado:** A pipeline de restore (descriptografar -> descompressão -> pipe psql) pode lançar exceções não tratadas (panic) se o arquivo criptografado estiver com header corrompido, derrubando a thread worker sem notificar a TUI.
- **Mitigação:** Isolar as rotinas de `decrypt` e `decompress` em blocos `try/except CatchableError`, garantindo que um `Channel.trySend(Msg(status: stError))` ocorra infalivelmente, habilitando o modelo Fail-safe da UI.

### 3.3. Concorrência Assíncrona Cloud e Falhas de Rede
- **Ponto Cego Identificado:** Durante quedas abruptas de conexão (TCP Reset ou drop), a biblioteca `httpclient` do Nim, se configurada sem timeouts globais estritos em streaming, pode travar a worker thread *ad aeternum* esperando dados que nunca chegarão. 
- **Mitigação:** Reforçar as chamadas HTTP do motor Cloud (S3) com um timeout explícito e granular para leitura de chunks (ex: 15-30 segundos). Em caso de *timeout*, a rotina de cancelamento deve desalocar o stream da memória e propagar a falha via Channel.

### 3.4. Estado da Memória e Multithreading
- **Ponto Cego Identificado:** A comunicação constante entre a TUI e as Worker Threads envia centenas de mensagens por segundo, alocando múltiplas strings em memória (Logs de STDOUT). Embora o coletor de lixo `ORC` do Nim lide eficientemente com memórias não bloqueantes em ciclos curtos, *memory peaks* (picos) altos foram observados sob uso contínuo (~73MB no *peakmem* do Restore). Vazamento real (*leak*) não foi identificado, mas o *resident set size (RSS)* cresce temporariamente.
- **Mitigação:** Implementar limite agressivo no número de mensagens visíveis e *debouncing* (aglutinamento de logs antes do envio pelo channel) para diminuir a taxa de alocações simultâneas.

## 4. Regressões
- Não foram encontradas regressões funcionais na passagem das builds até o commit testado. A compatibilidade do schema transacional com a infraestrutura S3 continua intacta.

## 5. Próximos Passos (Action Items)
1. Aprovar e implementar Gherkin features (`docs/engineering/qa_plans/cloud_and_resilience.feature`) criados como testes BDD automatizados (via `nim-testament` ou `behave`).
2. Adicionar Try/Except defensivo na worker thread do restore.
3. Parametrizar Timeout de Socket nas instâncias HTTP S3 (Cloud).
