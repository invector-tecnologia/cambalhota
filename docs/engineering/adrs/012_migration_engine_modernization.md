# ADR 012: Migration Engine Modernization

**Data:** 18 de Julho de 2026
**Status:** Implementado

## Contexto
Atualmente, o `src/main.nim` abriga um código legado do antigo "Cambalhota Migration Engine". Na linha 138, funções como `restoreSchema` e demais lógicas de migração dependem da leitura de variáveis de ambiente (`DB_HOST`, `DB_PASS`, `DB_USER`) para estabelecer conectividade com os bancos de dados alvo. 

Essa abordagem é obsoleta perante o atual ecossistema da aplicação, que já possui um mecanismo centralizado e seguro (`Configuration Manager`) utilizando SQLite (`connections.db`) e OS Keyring. Além disso, o Migration Engine operava de forma isolada, não tirando proveito da TUI Tatuí unificada (`src/tui/app.nim`), dos modais assíncronos e do `logChannel` (ADR-011).

## Decisão
1. **Consumo de Conexões via SQLite:** O Migration Engine será modernizado para abandonar definitivamente as variáveis de ambiente. Passará a consumir o estado e as credenciais das conexões persistidas localmente chamando `listConnections()` (do módulo `core/db.nim`).
2. **Mesclagem na TUI Principal:** A interface do Migration Engine não permanecerá *standalone*. Toda a interatividade e execução das migrações serão **mescladas na TUI principal** (`src/tui/app.nim`), criando uma nova aba dedicada (ex: "Migrations"). O arquivo `src/main.nim` passará a atuar estritamente como *entrypoint* orquestrador da aplicação global.
3. **UX Assíncrona e Central de Logs:** Com a mesclagem, as migrações adotarão a mesma arquitetura fail-safe do ADR-011. As execuções (`Up`, `Down`, validações de `checksum`) ocorrerão em *Worker Threads*, repassando a saída (sucesso, erros de restrição, etc) via `logChannel` para o Console Visual Integrado na TUI, com modais overlay para feedback visual, sem congelar a interface.

## Trade-offs
- **Positivos:** 
  - Unifica a experiência do usuário, que passa a ter Configurações, Dumps, Restores e Migrations em uma única interface visual robusta.
  - Segurança aprimorada, garantindo que senhas de migração passem pelas mesmas defesas de criptografia (OS Keyring + SQLite).
  - Previsibilidade e fluidez na execução, com os logs de migração renderizados em tempo real no Console sem "quebrar" a renderização do terminal.
- **Negativos:**
  - Exige um esforço considerável de refatoração para desvincular a lógica de migração da antiga CLI e adaptá-la para responder aos eventos da aba na TUI.
  - A TUI `app.nim` sofre um leve aumento de complexidade ao gerenciar uma nova árvore de domínios visuais (Migrations).

## Consequências
- A assinatura de funções como `restoreSchema` perderá parâmetros baseados em env vars e passará a receber objetos de conexão consolidados (ex: um ID de conexão ou a struct de configuração já decriptada).
- A interface `src/main.nim` deixará de possuir fluxos de I/O de tela diretos.
- O *Architecture Map* foi atualizado para consolidar o Migration Engine como um componente integrado ao *Configuration Manager* e refletido na TUI Tatuí principal.
