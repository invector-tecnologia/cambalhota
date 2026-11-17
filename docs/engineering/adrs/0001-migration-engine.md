# ADR 0001: Migration Engine Architecture (Version Control)

## Status
Accepted

## Date
2026-07-16

## Context
One of the main epics (Epic 2) of the **Cambalhota** project is the management of structural database migrations. According to our Engineering Constitution, we must follow these mandatory guidelines:
- **DB-02:** Mandatory support for PostgreSQL, MySQL and SQL Server.
- **ARQ-01:** Engine developed in Nim, focused on stability and I/O.
- **ARQ-03:** The migration system (`up`/`down`) must follow the versioning standards established by Flyway and Liquibase.

To deliver *Feature 2.3* (Safe execution with auditing and version control) and ensure deterministic database evolution, we need to define how version control will be structured on disk, how transactional execution will happen, and how migrations will be audited.

## Decision

We define the following design for the Cambalhota Migration Engine:

### 1. File Naming and Structure
We will adopt a version-based convention for the physical migration files. Each schema transition will have separate files for evolution and rollback:
- **Up Migrations:** `V{Version}__{Description}.sql` (e.g., `V1.0.1__Create_Users_Table.sql`)
- **Down Migrations (Rollbacks):** `U{Version}__{Description}.sql` (e.g., `U1.0.1__Create_Users_Table.sql`)

Version numbering must allow semantic versioning (e.g., `1.0.1`, `202607161700`, etc.) and will be sorted alphanumerically.

### 2. History Table (Audit Table)
Cambalhota will create and maintain a reserved control table in the target database, named `cambalhota_schema_history` (similar to `flyway_schema_history`). This table will have the following mandatory columns:
- `installed_rank` (PK, installation order)
- `version` (string representing the version)
- `description` (migration name/description)
- `type` (SQL, Nim-script, etc.)
- `script` (file name)
- `checksum` (hash of the SQL file content)
- `installed_by` (database user)
- `installed_on` (execution timestamp)
- `execution_time` (ms spent)
- `success` (success or failure boolean)

### 3. Safe Execution Mechanism
1. **Locking:** Before starting the migration process, a database lock will be acquired (e.g., `pg_advisory_lock` on PostgreSQL or a lock table on MySQL/SQL Server) to prevent race conditions (multiple CLI instances running migrations at the same time).
2. **Validation (Checksum):** Migrations already recorded in the history will be read and their checksums validated against the local files. If a script modified on disk differs from the one executed in the past, the process is stopped.
3. **Execution:** Pending migrations (files present in the directory but not recorded in the database) will be sorted and applied sequentially. Whenever the target database allows it (e.g., PostgreSQL), the DDL (Data Definition Language) changes of each version will be wrapped in transactions (`BEGIN` and `COMMIT`) for atomicity.

### 4. Diffing and Automatic Generation (Feature 2.2)
To support automated migration proposals through comparison, the Nim engine will extract metadata (`information_schema` and specific schemas) from two database states. It will detect diffs in tables, indexes and constraints and then auto-generate the `V` and `U` pair, ready for the developer to approve before the final execution.

## Consequences

### Positive
- **Predictability:** Ensures every schema transition is traceable, reproducible and transactional.
- **Auditing:** Fine-grained control in `cambalhota_schema_history` lets operators use the TUI (Tatuí) to audit in detail who installed the migrations and when (Feature 2.3).
- **Standardization:** Since the logic copies Flyway's robust design, the adoption curve for developers who already know the tool drops to zero.

### Challenges / Points of Attention
- DDL transactions are not always supported by DBMSs. MySQL, for example, performs an implicit commit when running DDL commands, which limits automatic rollbacks and requires careful execution.
- The native Nim mapping that will handle the SQL dialects of each of the three databases (PostgreSQL, MySQL, SQL Server) will require robust I/O and execution abstractions to work correctly.
