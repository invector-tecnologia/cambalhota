# ADR 011: Safe Execution & Storage (Console Visual e Política YYYY)

**Status:** Implementado

## Contexto
O Agente Produto determinou a abolição completa do uso de `term.restore()` e saídas de terminal não gerenciadas, migrando para modais de confirmação contextuais em overlay e um Console visual integrado na TUI (no `bodyRect`). Anteriormente, a execução de utilitários externos (como o `pg_dump`) poderia travar a thread de renderização ou sujar a tela ao tentar imprimir saídas diretamente no stdout do terminal hospedeiro.
Além disso, com o aumento progressivo da quantidade de dumps gerados pelo Cambalhota, é necessário um método mais escalável, organizado e performático para o armazenamento de arquivos no sistema de arquivos local (FileSystem).

## Decisão

### 1. Captura de Stdout Assíncrono e Console Visual
A execução de subprocessos externos (como `pg_dump`, `mysqldump`, via módulo `osproc` do Nim) será feita de forma assíncrona, capturando seus fluxos padrão (`stdout` e `stderr`) por meio de streams/pipes lidos em tempo real por **worker threads**.
- **Worker Threads e Streaming:** A worker thread invocará `startProcess` (com as opções adequadas, como `poUsePath`, `poStdErrToStdOut`, etc.) e lerá a saída continuamente via `outputStream`.
- **Comunicação Segura:** Cada linha ou bloco de log lido será envelopado em uma string (ou record correspondente) e repassado para o canal existente de comunicação (`logChannel: Channel[string]`).
- **Renderização Non-blocking:** A TUI, em seu *event loop* principal, consumirá periodicamente (usando `tryRecv()`) as mensagens do `logChannel` e as anexará ao widget de Console (inserido dentro do `bodyRect`). Isso evita que a UI "congele" durante os dumps pesados, provê feedback visual moderno e dispensa o uso do problemático `term.restore()`.

### 2. Nova Política Estrita do FileSystem (Armazenamento por Ano - `YYYY`)
A criação e organização de dumps locais passam a seguir uma estrutura estritamente particionada por diretório anual:
- **Caminho Obrigatório:** `~/.cambalhota/db_dump/YYYY/` (onde YYYY é o ano de geração do dump, ex: `~/.cambalhota/db_dump/2026/`).
- No ato do backup, o motor do Cambalhota verificará e criará o subdiretório correspondente ao ano atual (extraído do timestamp em execução) antes de instanciar o arquivo ou stream do dump.
- **Leitura Otimizada (Aba Restore):** O utilitário de listagem de dumps (na aba Restore da TUI) será refatorado para focar a varredura no diretório do ano atual/específico. Ele poderá navegar para anos anteriores sob demanda (via UI, como um combobox), limitando a leitura do disco e poupando tempo de CPU/memória ao invés de listar recursivamente milhares de arquivos desnecessários.

## Trade-offs
- **Complexidade de IO e Memória:** Gerenciar e limpar devidamente as instâncias de processos e pipes dentro de worker threads, somado à arquitetura de ORC do Nim, exige atenção redobrada aos *memory leaks* de handles do SO não finalizados.
- **Gerenciamento de Estado UI:** O Console interno armazenará grandes volumes de strings à medida que o log se estende, necessitando de uma política de *scrollback limit* ou *ring buffer* na UI para que a tela não perca quadros de renderização pela sobrecarga da árvore de componentes.
- **Navegação de Arquivos Limitada:** A restrição a diretórios anuais obriga a aba de Restore a gerenciar adequadamente a navegação do usuário em "páginas" por ano, introduzindo complexidade na busca (search) caso o usuário não saiba exatamente o ano de um backup.

## Consequências
- Fim das corrupções visuais e "limpezas" forçadas no terminal hospedeiro, alinhando a arquitetura ao design robusto e fluído exigido para as interfaces modernas.
- A orquestração das leituras de stream assíncronas isola perfeitamente o tempo do subprocesso, o que permite a implementação facilitada de botões de cancelamento ou aborte imediato pelo usuário a qualquer momento.
- Ao escalar para centenas ou milhares de backups gerados em rotinas diárias e anuais, a performance da aplicação ao abrir a aba "Restauração" permanecerá ágil, mantendo o software confiável para usuários e servidores corporativos (evitando varreduras gigantes em um único diretório flat).
