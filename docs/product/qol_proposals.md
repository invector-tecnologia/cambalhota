# Cambalhota TUI - Quality of Life (QoL) & UX Proposals

## Overview
With v1.0.1 consolidated (static panel, tab menu, floating modal forms and status bar), the foundation of the retrowave interface (Nim + `tatui`) is solid. The next strategic step for Product is to raise the user experience by drawing on the best practices of modern TUIs such as `k9s`, `lazygit` and `lazydocker`. The focus is to ensure productivity, operational confidence and immediate visual feedback for users (developers, administrators and operators).

## Feature and Behavior Proposals

### 1. Fuzzy Search in Dump Lists (Inspiration: `k9s`, `lazygit`)
- **Description:** In the *Restore* tab, let the user press `/` to open a search prompt. The backup list must be filtered in real time (fuzzy matching) by dump name, date or environment tags.
- **UI/UX Impact:** Essential for users who manage multiple environments and dozens of backups. Avoids tedious arrow and scroll navigation, making it possible to find the right file almost instantly.

### 2. Real-Time Validation and "Test Connection" (Inspiration: Modern Web Forms)
- **Description:** In the floating modals (SQLite, AES-256, etc), validate inputs as the user types (e.g., validate that the port is numeric). Also add a `[ Test Connection ]` shortcut/button (e.g., `ctrl+t`) that tries to connect to the database *before* closing the modal.
- **UI/UX Impact:** Establishes an immediate "feedback loop". Prevents the user from saving broken settings and only discovering the error when trying to run a backup command, minimizing frustration and cryptic error logs.

### 3. Contextual Metadata Preview Panel (Inspiration: `lazydocker`)
- **Description:** When browsing the backup list in the *Restore* tab, the adjacent *side-by-side* panel must dynamically display the metadata of the focused dump: formatted file size (MB/GB), readable creation date, source database, integrity hash, and an estimated restore time.
- **UI/UX Impact:** Brings psychological safety. Restoring a database is a high-impact action; having the details visible before confirming increases confidence in the operation and avoids accidental, unwanted data overwrites.

### 4. Real Progress Indicators (Inspiration: `htop`, `k9s`)
- **Description:** Replace the static "Processing..." message in the bottom bar with real progress bars (`[=====>    ] 50%`) or highly fluid interactive spinners for background processes.
- **UI/UX Impact:** Database I/O tasks can take a while. Dynamic indicators prove to the user that Cambalhota has not "frozen", providing predictability and improving the perceived performance of the TUI.

### 5. Dynamic Shortcut Hints (Inspiration: `nano`, `lazygit`)
- **Description:** The bottom bar must display the keyboard shortcuts *specific to the current context*. For example, in the menu: `<Tab> Switch Tab | <q> Quit`. Inside a modal: `<Enter> Save | <Esc> Cancel | <Ctrl+t> Test`.
- **UI/UX Impact:** Makes the application "self-documenting". The user does not need an external document to discover shortcuts, drastically flattening the learning curve.

### 6. Command Palette / Quick Actions (Inspiration: VS Code, Sublime)
- **Description:** Press `:` or `Ctrl+p` to open a centered input that fires text commands (e.g., `backup:all`, `config:edit`).
- **UI/UX Impact:** Aimed at "power users", it lets them run complex workflow actions from muscle memory, without manually navigating through the interface tabs.

### 7. Restored Backups History (User Request)
- **Description:** Create a view or panel that shows an audit trail/history of every backup that has been restored, stating exactly **which database** and **which schema** it was injected into.
- **UI/UX Impact:** Essential for governance and traceability. Avoids "flying blind" by making it quick to know when and where a specific version of a dump was applied.

### 8. Visual Refactoring of the Connection List (User Request)
- **Description:** Restructure the list rows in the settings tab. Instead of a raw string, draw the properties in a highly intuitive, visually separated way: `Database Type (Engine: pg, mysql, etc)`, `Database Name`, and `Database Schema`.
- **UI/UX Impact:** Instant reading of the database inventory. Colors or ASCII icons can be used to visually tell a PostgreSQL connection apart from a SQL Server or SQLite one, improving visual scanning.

### 9. Dump Traceability and Location (User Request)
- **Description:** Improve the listing of existing backup files, making it very explicit **where they are physically stored** (e.g., `[LOCAL]`, `[S3]`, `[GCS]`, disk directory).
- **UI/UX Impact:** Avoids confusion about where the dump is being read from, especially preparing the ground for when Cambalhota supports multi-cloud extractions.
