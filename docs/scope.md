# Strategic Project Scope (PRD) - Cambalhota

This document sets out the fundamental business guidelines, the boundaries of action and the technology foundations of Tavolo. It acts as the main contract between the Product, Technical Leadership and Engineering areas.

## 1. Value Proposition and Prioritization (MoSCoW Matrix)
The scope definition follows a strict priority order focused on feasibility, ROI and Time-to-Market. The system covers both the secure extraction and backup of data/schemas in the cloud (or locally) and the advanced management of structural database migrations, with Flyway and Liquibase as benchmarks.

*   **1.1. Critical Requirements (Must-Have):**     
    *   The system will be agnostic and multi-engine, able to extract metadata and data from multiple databases (PostgreSQL, Oracle, MSSQL, MySQL, SQLite, SPANNER, INDEDB, VECTORDB, BigQuery, CouchDB, MongoDB, etc). The Extractor will use the standard output of each engine's native CLIs and utilities (e.g., pg_dump, mysqldump, expdp, sqlcmd, sqlite3, mongodump, bq extract, etc) and will present the result in a standardized format.
    *   The system will persist the extracted backup files, encrypted by default, in the local directory `~/.cambalhota/db_dumps/YYYY/`.
    *   The system will restore the schema, its tables and its data that were previously extracted. It will be able to list the backups persisted in the host's local environment (`~/.cambalhota/db_dumps/YYYY/`).
    *   The system will be able to automatically generate migration files with up and down routines.
    *   The system will be able to compare two versions of the database and generate migration files with the differences found.
    *   The system will be able to run the sequence of migration files, monitor their execution and perform structural version control.
    *   The system will be able to generate success and failure reports for the execution of migration files and display them on the user's screen.
*   **1.2. Strategic Requirements (Should-Have):** 
    *   The application will be able to generate technical documentation (in Markdown) and test files (SQL DDL/DML) based on the extracted schema.
    *   The system will require the configuration of a Git repository or "CDN" (e.g., Dropbox, Google Drive, OneDrive, GCP buckets, Cloudflare R2, etc.) to upload and redundantly store the extracted backup files, applying data compression before sending.
*   **1.3. Enhancement Requirements (Nice-to-Have):** 
    *   The application will be able to generate visual representations of the extracted schema.

## 2. User Domain (Actors and Target Audience)
A clear map of the users who interact with the system, to guide *Domain-Driven Design* (DDD) and permission management.

*   **2.1. Technical Users**
    *   **Software Developers:** Interact with the system to extract schemas, manage migrations, and generate technical documentation and test files based on the schema.
    *   **Database Administrators (DBAs):** Interact with the system to perform structured extractions and backups, monitor migrations, list and restore backups from a Git/CDN repository, and audit structural changes.

## 3. Core Feature Topology

*   **3.1. System Configuration and Connection**
    *   The system will be able to configure database access credentials using the provided connection URL.
    *   The system must allow registering multiple connections through the graphical interface, storing passwords securely (AES encryption) in a local SQLite database, eliminating the use of environment variables.
    *   The system will be able to identify and display the names of the existing schemas so the user can select which one to extract/operate on.
    *   The system will be able to configure the generation format of migration files (Plain or SQL).
*   **3.2. Extraction (Backup) and Persistence**
    *   The system will be able to extract metadata and data agnostically for all supported databases, invoking their standard CLI utilities behind the scenes, and present the standardized result.
    *   The system will persist the generated, encrypted backup files directly on the local disk in `~/.cambalhota/db_dumps/YYYY/`.
*   **3.3. Restore**
    *   The system will dynamically list all backups available in the host's local environment in `~/.cambalhota/db_dumps/YYYY/`.
    *   The system will perform a full restore (schema, tables and data) from a local backup listed and selected by the user.
    *   The system will allow cross-database restore, making it possible to generate the dump from a source connection and restore the data into a previously registered target connection.
*   **3.4. Migration Generation and Execution**
    *   The system will generate migration files with up and down routines.
    *   The system will compare two versions of the database and generate diff (migration) files.
    *   The system will run and audit migrations with robust version control (Flyway/Liquibase level).
    *   The system will display execution success/failure reports in the interface.
*   **3.5. Technical Documentation and Visualization**
    *   Generation of technical documentation in Markdown and test files (DDL/DML).
    *   Generation of visualizations of the extracted schema.
*   **3.6. Security and Payload Optimization**
    *   The system will encrypt files with a local security key at creation time, saving the versions on disk encrypted by default.
    *   The system will compress the extracted files in real time (streams) in the future to minimize network usage in the cloud integration.

## 4. Boundaries and Scope Protection (Out of Scope)
To shield the engineering team against *scope creep* and ensure architectural focus.

*   **4.1. Absolute Restrictions (Forbidden):** 
    *   The system must not store access credentials for the databases or for the CDN/Git services in plain text in the code repository.

## 5. Interface and Experience Guidelines (UX/UI)
Visual contracts and benchmark references for developing the presentation layers.

*   **5.1. Visual Standards (Design System):** Use a Terminal User Interface (TUI) with the following guidelines:
    - Dark mode layout
    - Primary color palette: `#2E3440`
    - Highlights: `#88C0D0` (information), `#BF616A` (alert), `#A3BE8C` (success)
    - Typography: `Monoid`, size 13px
    - Layout based on tabs and vertical panels
    - Use of rounded borders (`corner_radius`)
    - Side padding of `16px`
    - Display of a project Logo in 'Retrowave' ASCII Art, pinned to the top-left corner of the screen.

## 6. Technology Foundations (Stack Baseline)
Definition of the technical ecosystem approved by leadership to support the operation.

*   **6.1. Presentation Layer (Frontend TUI):** [Tatuí](https://github.com/invector-tecnologia/tatui)
*   **6.2. Business Layer (Backend):** [Nim](https://github.com/nim-lang/nim)
*   **6.3. Persistence Layer (Database):** [db-schema-data-dump](https://github.com/invector-tecnologia/db-schema-data-dump)
*   **6.4. Infrastructure and Operations (Infra/DevOps):** Terminal / CLI
