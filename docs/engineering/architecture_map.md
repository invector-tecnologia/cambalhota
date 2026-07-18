# Mapa Arquitetural — Cambalhota

## Visão Geral
O **Cambalhota** é uma ferramenta CLI/TUI nativa compilada em **Nim** (com gestão de memória via ORC), focada no controle de versão estrutural de bancos de dados relacionais e rotinas de extração/restauração (dumps e backups). O design foi projetado para assegurar robustez de I/O, previsibilidade transacional em migrações e uma experiência visual interativa diretamente no terminal.

## Diagrama de Blocos Arquiteturais

```mermaid
flowchart TD
    subgraph UI ["Frontend / CLI"]
        TUI[Interface Tatuí (com Menu Side-by-side e Logo ASCII)]
        CLI[Comandos CLI e Automação]
    end

    subgraph Core ["Motor em Nim (Core Engine)"]
        AsyncIO[Camada de IO Assíncrono]
        DBCore[db_core.nim - Adaptadores RDBMS]
        MigEngine[Migration Engine]
        ExtAdapter[Extractor Adapter / Factory]
        DumpRest[Dump & Restore Engine (Cross-Database via osproc)]
        StreamPipe[Pipeline de Streaming & Criptografia]
        ConfigManager[Configuration Manager]
    end

    subgraph Persistence ["Armazenamento e Persistência"]
        CDN[CDN / Git / Cloud Buckets]
        Local[Sistema de Arquivos Local (Dumps)]
        SQLite[(Local SQLite DB - Conexões e Histórico)]
        Keyring{OS Keyring}
    end

    subgraph DB ["Banco de Dados Alvo"]
        TargetDB[(PostgreSQL, MySQL, SQL Server)]
        AuditTable[Cambalhota.cambalhota_schema_history]
    end

    TUI <--> AsyncIO
    TUI <--> Core
    CLI <--> Core
    AsyncIO <--> DumpRest
    MigEngine <--> DBCore
    DumpRest <--> DBCore
    DumpRest <--> ExtAdapter
    ExtAdapter --> StreamPipe
    DumpRest <--> StreamPipe
    DBCore <--> TargetDB
    TargetDB --- AuditTable
    Core <--> CDN
    Core <--> Local
    ConfigManager <--> SQLite
    ConfigManager <--> Keyring
    TUI <--> ConfigManager
```

## Detalhamento dos Componentes Técnicos

### 1. Camada de UI (Frontend / CLI)
- **TUI Tatuí:** Provê toda a experiência visual rica via terminal para interatividade humana.
  - Implementa um Design System unificado (Dark mode, fontes monoespaçadas, destaques semânticos de cores, Logo Retrowave ASCII global).
  - Organiza funcionalidades complexas em abas intuitivas (Configuração, Backup, Restauração, Histórico).
  - Emprega layouts "side-by-side" (como na aba de Cross-Restore) para segmentação cognitiva (Origem vs. Destino).
  - Proteção contra *Buffer Overflow* e injeção de caracteres: limitação rigorosa de `len` e sanitização em todos os campos de input, garantindo estabilidade e segurança.
  - **Console Visual Integrado:** Abolição de `term.restore()` em prol de modais overlay e logs reativos (`logChannel`) em um Console que evita o travamento da thread de UI (ADR-011).
- **CLI Utilities:** Interface programática *headless* para orquestração (via CI/CD) e disparo automatizado de comandos.
  - Utiliza `parseopt` para validação rigorosa de parâmetros, implementando um *Hard Block* ativo que aborta a extração (ex: barrando o schema `public`) e injeta estados de erro (`stError`) na thread da UI para feedback imediato ao usuário.

### 2. Motor em Nim (Backend / Core Engine)
Construído com gestão `ORC` para maximizar a previsibilidade e diminuir a latência do garbage collector, lidando de modo eficiente com volumes altos de leitura/escrita e redes.

#### Camada de IO Assíncrono (Processos em Background)
- Desacopla execuções pesadas (como o streaming do `pg_dump` e chamadas OS via `osproc`) da Thread Principal através de Threads e Canais (`Channel[Msg]`).
- Captura de forma assíncrona (via streams/pipes em worker threads) o `stdout`/`stderr` de subprocessos, gerando mensagens em tempo real no `logChannel` para renderização fluida no Console da TUI (ADR-011).
- Assegura que a UI Tatuí nunca congele durante I/O, repassando status e logs em tempo real (Promessa Fail-safe).

#### Configuration Manager & Governança Local
- Gerencia o estado das conexões de banco de dados e as configurações de provedores de Cloud (S3, Git, Google Drive, etc) configuradas localmente pela TUI, além de manter auditoria de operações.
- Elimina o uso de variáveis de ambiente (`.env`) em favor de um banco **SQLite** local criptografado (`connections.db`). A tabela `restore_history` armazena localmente o registro histórico detalhado, enquanto `cloud_providers` armazena as integrações de nuvem com flexibilidade de esquema via JSON.
- Interage com o **OS Keyring** nativo (Secret Service, Keychain, Credential Locker) para armazenar de forma segura a chave mestra (Master Key), utilizada na encriptação e decriptação (AES-256 via `nimcrypto`) das senhas dos SGBDs e das credenciais de nuvem (Access Keys, OAuth Tokens, SSH Keys).

#### `db_core.nim` (Camada de Acesso RDBMS)
- Driver agnóstico que atua como tradutor de dialetos para PostgreSQL, MySQL e SQL Server.
- Realiza consultas na `information_schema` e converte metadados (tipos, schemas e views) para a abstração interna do Cambalhota.

#### Migration Engine
Uma implementação Flyway-like responsável pela evolução contínua da estrutura do banco.
- **Nomenclatura Semântica:** Lê do disco os arquivos de versão estruturados (`V{Timestamp}__{Desc}.up.sql` para Up e `V{Timestamp}__{Desc}.down.sql` para Rollback).
- **Controle Concorrente e Transacional:** Aplica Lockings (ex: `pg_advisory_lock` ou lock table) para evitar corridas ao atualizar o schema, blindando as execuções dentro de blocos transacionais explícitos (`BEGIN/COMMIT`) em bancos suportados.
- **Rastreio e Auditoria:** Registra a evolução em `Cambalhota.cambalhota_schema_history`, registrando timestamps, durações, autoria e os respectivos *checksums* anti-adulteração de arquivos.
- **Automação de Diffing:** Extrai as assinaturas de tabelas, índices e *constraints* de dois estados do banco e sugere proativamente as migrações (Up/Down) do *delta* das diferenças.

#### Dump & Restore Engine
- Orquestra extrações unificadas e estruturadas em arquivos padrão (`yyyy-mm-dd_..._dump-db.sql`).
- **Política Estrita do FileSystem:** Os dumps locais são obrigatoriamente armazenados particionados por ano em `~/.cambalhota/db_dump/YYYY/`, assegurando listagens performáticas na aba Restore sem gargalos ao lidar com milhares de arquivos acumulados (ADR-011).
- Executa rotinas completas de *restore* do banco, permitindo inclusive o mock e a carga de fixtures localmente, assim como migrações cruzadas (**Cross-Database Restore**) onde o Dump é aplicado em uma conexão Destino via acionamento de CLI nativo em `osproc`.
- **Extractor Adapter / Factory Pattern:** Resolve e instancia dinamicamente o utilitário nativo de dump compatível com o banco alvo (ex: `pg_dump`, `mysqldump`, `mongodump`), tornando a arquitetura agnóstica ao motor de dados. A injeção de credenciais decriptadas é feita por arquivos temporários ou variáveis seguras injetadas no subset OSProc.
- **Segurança e Otimização:** Delega processamento pesado ao *Pipeline de Streaming & Criptografia* (ADR-004), interceptando a saída universal do utilitário instanciado (`stdout`) e operando em pedaços contínuos. A compressão (`std/zlib`) e a criptografia E2E (`nimcrypto` AES-256) ocorrem on-the-fly por blocos, blindando a memória contra falhas OOM. O pipeline possui tolerância a falhas na Worker Thread (ADR-010): erros de descriptografia de arquivos corrompidos não geram pânico, mas são isolados por `try/except` e repassados como status de erro à TUI. Em paralelo, a *worker thread* alimenta a interface com o status dos blocos processados via canais (`Channel`).

### 3. Integração Remota (Persistência Off-Site)
- **S3 / Cloud Connectors:** Adaptador responsável pelo offload autônomo dos dumps massivos gerados no Core para serviços de Cloud Storage (AWS S3, MinIO, Cloudflare R2). Garante resiliência de rede (ADR-010) com configuração estrita de timeout (evitando *deadlocks* em conexões instáveis), implementação de *retries* e *exponential backoff*.
- **Multithreading e Non-blocking I/O:** O envio e recebimento dos arquivos é feito estritamente através de **Worker Threads** segregadas. O status de progresso (Upload/Download) é transmitido à TUI principal através de `Channel[T]`, garantindo uma UI (`app.nim`) 100% responsiva sem congelamentos durante os gargalos de rede. Para evitar picos de alocação de memória (ADR-010), implementa-se *debouncing* e *batching* no envio de atualizações (ex: de 100 em 100ms em vez de atualizar a cada *byte* transferido), trafegando tipos de dados leves pelo canal.
- **Protocolo Agnóstico:** Emprega a biblioteca padrão `httpclient` (ou ecosistema Nim HTTP) para orquestração de APIs REST via AWS Signature V4 em vez de caros SDKs pesados, mantendo o executável extremamente leve e focado no protocolo.
