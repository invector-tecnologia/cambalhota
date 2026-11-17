# Features Map - Cambalhota

This document details all Epics and Features of the Cambalhota product, acting as a traceable map from the Strategic Scope (PRD) and the architectural decisions made by engineering.

## Epic 1: System Configuration and Connection
- **Feature 1.1: Connection Management** `[Done] [QA Approved]` `(v1.0)`
  - Secure credential configuration via connection URL with agnostic multi-engine support (PostgreSQL, Oracle, MSSQL, MySQL, SQLite, SPANNER, INDEDB, VECTORDB, BigQuery, CouchDB, MongoDB, etc).
  - Blocking of credential storage in plain text in the source code.
  - Dynamic identification and listing of the schemas available in the database for selection.
- **Feature 1.2: Repository/CDN Integration** `[To Do]` `(v2.0)`
  - Linking a "CDN" or Git Repository (S3, GCP Buckets, Cloudflare R2, Google Drive, Dropbox, OneDrive, or NAS) to act as the central hub for cloud mirroring and upload.
- **Feature 1.3: Project Preferences** `[To Do]` `(v1.0)`
  - Configuration of the file generation and export format, such as migrations (Plain text or pure SQL).
- **Feature 1.4: Visual Management of Multiple Connections** `[To Do]` `(v1.0.1)`
  - Elimination of environment variables for connections, adopting configuration exclusively via the TUI.
  - Local storage in encrypted (AES) SQLite for secure persistence of multiple credentials.

## Epic 2: Extraction (Backup) and Persistence
- **Feature 2.1: Structured Extraction** `[Done] [QA Approved]` `(v1.0)`
  - Unified processing and dump of metadata and data, agnostically using the standard CLIs of each supported engine (e.g., pg_dump for PostgreSQL, expdp for Oracle, sqlcmd/bcp for MSSQL, mysqldump for MySQL, sqlite3 for SQLite, bq extract for BigQuery, mongodump for MongoDB, gcloud spanner for SPANNER, etc).
  - Automated standardization of output artifact naming (e.g., `yyyy-mm-dd_HhMM_schema_dump-db.sql`).
- **Feature 2.2: Remote Persistence** `[To Do]` `(v2.0)`
  - Automatic upload of the extracted dumps and artifacts to the CDN or Git Repository configured in Epic 1, ensuring cloud redundancy for the backups.

## Epic 3: Restore
- **Feature 3.1: Local Listing and History** `[Done] [QA Approved]` `(v1.0)`
  - Reading and visual display of all encrypted backup files and versions in the local directory `~/.cambalhota/db_dumps/YYYY/`.
- **Feature 3.2: Full Restore** `[Done] [QA Approved]` `(v1.0)`
  - End-to-end restore (structural schemas, tables and their data) into the database from a specific backup chosen by the user in the terminal.

## Epic 4: Migration Engine (Structural Version Control)
- **Feature 4.1: Flyway-like Migration System** `[Done] [QA Approved]` `(v1.0)`
  - Generation of physical files with transition (`up` / `V...__desc.sql`) and rollback (`down` / `U...__desc.sql`) scripts, following semantic or timestamp-based versioning.
- **Feature 4.2: Structural Diffing** `[To Do]` `(v2.0)`
  - Autonomous metadata comparison between two different database states (tables, indexes, constraints).
  - Auto-generation and proposal of migration scripts that fill in the detected differences before execution.
- **Feature 4.3: Transactional Execution and Concurrency Protection** `[Done] [QA Approved]` `(v1.0)`
  - Locking mechanism (e.g., `pg_advisory_lock`) blocking conflicting executions from other simultaneous instances.
  - Wrapping of DDL executions in a transactional block where the DBMSs support it (`BEGIN`/`COMMIT`).
- **Feature 4.4: Integrity and History Audit** `[Done] [QA Approved]` `(v1.0)`
  - Maintenance and tracking via the reserved `cambalhota_schema_history` table.
  - Checksum validation of the physical scripts against previously recorded executions, preventing dangerous later tampering.
  - Detailed recording of the time, author and success of the installation in the audit table and exposure in the reports.

## Epic 5: Terminal User Interface (TUI)
- **Feature 5.1: Standardized TUI Experience** `[Done] [QA Approved]` `(v1.0)`
  - Visual navigation through tabs and panels implemented on top of the base technology (Tatuí).
  - Design System-driven standardization: Dark mode, `Monoid` typography, fluid layout with rounded borders and highlights in logical colors (success, alert, information).
  - Display of rich panels for migration report output, audits and local restore listings.
- **Feature 5.2: Visual Identity and Cross Flow** `[To Do]` `(v1.0.1)`
  - Rendering of a Retrowave ASCII Art Logo in the top-left corner.
  - Independent selection of Source and Target databases to enable cross backup and restore intuitively.

## Epic 6: Documentation and Technical Utilities
- **Feature 6.1: Automatic DDL Documentation** `[To Do]` `(v2.0)`
  - Auto-generation of the structural schema's Data Dictionary in Markdown format, aimed at engineering.
- **Feature 6.2: Mock and Test** `[To Do]` `(v2.0)`
  - Focused DDL/DML extraction for local test environments (fixtures and seeders).
- **Feature 6.3: Architectural Visualization** `[To Do]` `(v2.0)`
  - Generation of exportable graphical representations showing the visual and relational structure of the extracted schema.

## Epic 7: Security and Payload Optimization
- **Feature 7.1: Default Disk Encryption** `[Done] [QA Approved]` `(v1.0)`
  - Encryption of backup artifacts by default (e.g., AES-256) persisted in the local directory `~/.cambalhota/db_dumps/YYYY/`, ensuring at-rest security on the host machine.
- **Feature 7.2: Stream Compression** `[Done] [QA Approved]` `(v2.0)`
  - On-the-fly compression (e.g., GZIP or ZSTD) for future upload to the CDN, reducing bandwidth consumption and storage costs.
