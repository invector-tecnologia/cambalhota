# ADR 012: Migration Engine Modernization

**Date:** July 18, 2026
**Status:** Implemented

## Context
Currently, `src/main.nim` holds legacy code from the old "Cambalhota Migration Engine". At line 138, functions such as `restoreSchema` and the rest of the migration logic depend on reading environment variables (`DB_HOST`, `DB_PASS`, `DB_USER`) to connect to the target databases. 

This approach is obsolete given the current application ecosystem, which already has a centralized, secure mechanism (`Configuration Manager`) using SQLite (`connections.db`) and the OS Keyring. In addition, the Migration Engine ran in isolation, without taking advantage of the unified Tatuí TUI (`src/tui/app.nim`), the asynchronous modals and `logChannel` (ADR-011).

## Decision
1. **Consuming Connections via SQLite:** The Migration Engine will be modernized to drop environment variables for good. It will consume the state and credentials of the locally persisted connections by calling `listConnections()` (from the `core/db.nim` module).
2. **Merging into the Main TUI:** The Migration Engine interface will not stay *standalone*. All migration interaction and execution will be **merged into the main TUI** (`src/tui/app.nim`), with a new dedicated tab (e.g., "Migrations"). The `src/main.nim` file will act strictly as the orchestrating *entrypoint* of the global application.
3. **Asynchronous UX and Central Logs:** With the merge, migrations will adopt the same fail-safe architecture as ADR-011. Executions (`Up`, `Down`, `checksum` validations) will run in *Worker Threads*, forwarding the output (success, constraint errors, etc.) via `logChannel` to the Integrated Visual Console in the TUI, with overlay modals for visual feedback, without freezing the interface.

## Trade-offs
- **Positive:** 
  - Unifies the user experience, which now has Settings, Dumps, Restores and Migrations in a single robust visual interface.
  - Improved security, ensuring that migration passwords go through the same encryption defenses (OS Keyring + SQLite).
  - Predictable, fluid execution, with migration logs rendered in real time in the Console without "breaking" terminal rendering.
- **Negative:**
  - Requires considerable refactoring effort to decouple the migration logic from the old CLI and adapt it to respond to the TUI tab events.
  - The `app.nim` TUI gets slightly more complex by managing a new tree of visual domains (Migrations).

## Consequences
- The signature of functions such as `restoreSchema` will lose env-var-based parameters and will receive consolidated connection objects instead (e.g., a connection ID or the already-decrypted configuration struct).
- The `src/main.nim` interface will no longer have direct screen I/O flows.
- The *Architecture Map* was updated to consolidate the Migration Engine as a component integrated with the *Configuration Manager* and reflected in the main Tatuí TUI.
