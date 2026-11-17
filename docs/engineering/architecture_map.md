# Architecture Map — Cambalhota

## Overview
**Cambalhota** is a native CLI/TUI tool compiled in **Nim** (with ORC memory management), focused on structural version control of relational databases and on extraction/restore routines (dumps and backups). The design aims to ensure robust I/O, transactional predictability in migrations and an interactive visual experience directly in the terminal.

## Architecture Block Diagram

```mermaid
flowchart TD
    subgraph UI ["Frontend / CLI"]
        TUI[Tatuí Interface (with Side-by-side Menu and ASCII Logo)]
        CLI[CLI Commands and Automation]
    end

    subgraph Core ["Nim Engine (Core Engine)"]
        AsyncIO[Asynchronous IO Layer]
        DBCore[db_core.nim - RDBMS Adapters]
        MigEngine[Migration Engine]
        ExtAdapter[Extractor Adapter / Factory]
        DumpRest[Dump & Restore Engine (Cross-Database via osproc)]
        StreamPipe[Streaming & Encryption Pipeline]
        ConfigManager[Configuration Manager]
    end

    subgraph Persistence ["Storage and Persistence"]
        CDN[CDN / Git / Cloud Buckets]
        Local[Local File System (Dumps)]
        SQLite[(Local SQLite DB - Connections and History)]
        Keyring{OS Keyring}
    end

    subgraph DB ["Target Database"]
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

## Technical Component Details

### 1. UI Layer (Frontend / CLI)
- **Tatuí TUI:** Provides the whole rich visual experience in the terminal for human interaction.
  - Implements a unified Design System (dark mode, monospaced fonts, semantic color highlights, global Retrowave ASCII logo).
  - Organizes complex features into intuitive tabs (Configuration, Backup, Restore, History, Migrations).
  - Uses "side-by-side" layouts (as in the Cross-Restore tab) for cognitive segmentation (Source vs. Target).
  - Protection against *Buffer Overflow* and character injection: strict `len` limits and sanitization on every input field, ensuring stability and security.
  - **Integrated Visual Console:** Removal of `term.restore()` in favor of overlay modals and reactive logs (`logChannel`) in a Console that avoids blocking the UI thread (ADR-011).
- **CLI Utilities:** A *headless* programmatic interface for orchestration (via CI/CD) and automated command triggering.
  - Uses `parseopt` for strict parameter validation, implementing an active *Hard Block* that aborts the extraction (e.g., blocking the `public` schema) and injects error states (`stError`) into the UI thread for immediate user feedback.

### 2. Nim Engine (Backend / Core Engine)
Built with `ORC` memory management to maximize predictability and reduce garbage collector latency, efficiently handling high read/write and network volumes.

#### Asynchronous IO Layer (Background Processes)
- Decouples heavy executions (such as `pg_dump` streaming and OS calls via `osproc`) from the Main Thread through Threads and Channels (`Channel[Msg]`).
- Asynchronously captures (via streams/pipes in worker threads) the `stdout`/`stderr` of subprocesses, producing real-time messages on `logChannel` for smooth rendering in the TUI Console (ADR-011).
- Ensures the Tatuí UI never freezes during I/O, forwarding status and logs in real time (Fail-safe Promise).

#### Configuration Manager & Local Governance
- Manages the state of database connections and the Cloud provider settings (S3, Git, Google Drive, etc.) configured locally through the TUI, and keeps an audit trail of operations.
- Removes the use of environment variables (`.env`) in favor of an encrypted local **SQLite** database (`connections.db`). The `restore_history` table stores the detailed history record locally, while `cloud_providers` stores cloud integrations with schema flexibility through JSON.
- Interacts with the native **OS Keyring** (Secret Service, Keychain, Credential Locker) to securely store the Master Key, used to encrypt and decrypt (AES-256 via `nimcrypto`) DBMS passwords and cloud credentials (Access Keys, OAuth Tokens, SSH Keys).

#### `db_core.nim` (RDBMS Access Layer)
- Agnostic driver that acts as a dialect translator for PostgreSQL, MySQL and SQL Server.
- Queries `information_schema` and converts metadata (types, schemas and views) into Cambalhota's internal abstraction.

#### Migration Engine
A Flyway-like implementation responsible for the continuous evolution of the database structure.
- **Connection Integration (New):** Consumes credentials directly from the connections saved and decrypted by the `Configuration Manager` (SQLite + Keyring), dropping the use of environment variables. Executions produce logs and status reported via `logChannel` to the unified TUI (ADR-012).
- **Semantic Naming:** Reads the structured version files from disk (`V{Timestamp}__{Desc}.up.sql` for Up and `V{Timestamp}__{Desc}.down.sql` for Rollback).
- **Concurrency and Transaction Control:** Applies locks (e.g., `pg_advisory_lock` or a lock table) to prevent races when updating the schema, shielding executions inside explicit transaction blocks (`BEGIN/COMMIT`) on supported databases.
- **Tracking and Auditing:** Records the evolution in `Cambalhota.cambalhota_schema_history`, storing timestamps, durations, authorship and the corresponding anti-tampering file *checksums*.
- **Diffing Automation:** Extracts the signatures of tables, indexes and *constraints* from two database states and proactively suggests migrations (Up/Down) for the *delta* of the differences.

#### Dump & Restore Engine
- Orchestrates unified, structured extractions into standard files (`yyyy-mm-dd_..._dump-db.sql`).
- **Strict FileSystem Policy:** Local dumps must be stored partitioned by year in `~/.cambalhota/db_dump/YYYY/`, ensuring fast listings in the Restore tab without bottlenecks when handling thousands of accumulated files (ADR-011).
- Runs full database *restore* routines, including local mocking and fixture loading, as well as cross migrations (**Cross-Database Restore**) where the Dump is applied to a Target connection by invoking the native CLI through `osproc`.
- **Extractor Adapter / Factory Pattern:** Dynamically resolves and instantiates the native dump utility compatible with the target database (e.g., `pg_dump`, `mysqldump`, `mongodump`), making the architecture agnostic to the data engine. Decrypted credentials are injected through temporary files or secure variables injected into the OSProc subset.
- **Security and Optimization:** Delegates heavy processing to the *Streaming & Encryption Pipeline* (ADR-004), intercepting the universal output of the instantiated utility (`stdout`) and operating on continuous chunks. Compression (`std/zlib`) and E2E encryption (`nimcrypto` AES-256) happen on the fly per block, shielding memory against OOM failures. The pipeline is fault tolerant in the Worker Thread (ADR-010): decryption errors from corrupted files do not cause a panic; they are isolated by `try/except` and forwarded as an error status to the TUI. In parallel, the *worker thread* feeds the interface with the status of processed blocks through channels (`Channel`).

### 3. Remote Integration (Off-Site Persistence)
- **S3 / Cloud Connectors:** Adapter responsible for the autonomous offload of the massive dumps produced in the Core to Cloud Storage services (AWS S3, MinIO, Cloudflare R2). Ensures network resilience (ADR-010) with a strict timeout configuration (avoiding *deadlocks* on unstable connections), *retries* and *exponential backoff*.
- **Multithreading and Non-blocking I/O:** File upload and download run strictly in segregated **Worker Threads**. Progress status (Upload/Download) is sent to the main TUI through `Channel[T]`, keeping the UI (`app.nim`) 100% responsive with no freezes during network bottlenecks. To avoid memory allocation spikes (ADR-010), update delivery uses *debouncing* and *batching* (e.g., every 100ms instead of on every transferred *byte*), sending lightweight data types through the channel.
- **Agnostic Protocol:** Uses the standard `httpclient` library (or the Nim HTTP ecosystem) to orchestrate REST APIs via AWS Signature V4 instead of expensive, heavy SDKs, keeping the executable extremely lightweight and focused on the protocol.
