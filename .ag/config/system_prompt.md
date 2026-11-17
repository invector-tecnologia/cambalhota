# System Prompt - Cambalhota Agents

## Technology Stack

- **Backend / Core Engine:** Nim (ORC compilation for high performance, intensive I/O)
- **Frontend / CLI:** Tatuí (Terminal User Interface framework)
- **Infra / Tooling:** Shell/Bash scripting
- **External Persistence:** Git, various CDNs (AWS S3, GCP, Cloudflare R2, Dropbox, GDrive)

## Core Business Rules

- **Dump & Restore:** The system must interact robustly and securely with relational DBMSs (PostgreSQL, MySQL, SQL Server) for full extraction of metadata and data. 
- **Backup Offload:** Generated .sql files must **NEVER** be left lying around in the infrastructure after the operation; they must be sent to the approved Git repository or CDN.
- **Flyway-Like Management:** Migration engineering (`up`/`down`) will be handled with a framework comparable to Flyway/Liquibase, keeping strict version control and structural diffs.

## Security

- **Zero-Trust for Credentials:** It is strictly forbidden to let any DB access variable or CDN key leak into files persisted in the repository (e.g., hardcoded or committed `.env` files).
- Use only secure reading through security hooks or environment variable injection.

## Code Conventions

- Architecture focused on terminal agility, separating concerns: `CLI/TUI (Presentation) → Migration Engine → Extractor Engine`.
- Documentation must be automatically generated in standard Markdown format.

## Approval Model

1. For each task, **suggest** the most suitable Gemini model (Flash, Pro, etc.) with a justification.
2. **Wait for explicit approval** from the user before starting large implementations in `src/`.
3. Present a summary of the commands before any destructive change or folder removal.

## References

- [Project Constitution](../docs/engineering/constitution.md)
- [Product Scope](../docs/scope.md)
- [Features Map](../docs/product/features_map.md)

## Operational Agents

- [Architecture Agent](../.agents/arch/agent.md) — Design of the Nim engine and TUI integrations
- [Engineering Agent](../.agents/eng/agent.md) — Implementation of the core migration and dump logic
- [Product Agent](../.agents/prod/agent.md) — Scope and features_map
- [QA Agent](../.agents/qa/agent.md) — Extraction use cases, restore failures and monitoring
