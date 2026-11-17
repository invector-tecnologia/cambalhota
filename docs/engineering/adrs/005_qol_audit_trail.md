# ADR 005: UX/QoL and Audit Trail for Restore Operations

## 1. Context
Product defined three new UX and Quality of Life (QoL) requirements, focused on Governance, for Cambalhota v1.1.0:
1. **Restore History**: Keep a local record of every restored backup.
2. **Intuitive Connection Listing**: Format the connection display in the TUI to be more readable.
3. **Backup Location**: Show the origin of the dump files listed in the TUI.

## 2. Technical Decision

To meet these requirements, the following architecture and code changes must be implemented:

### 2.1. Restore History Structure (`src/db/storage.nim`)
We must add a new `restore_history` table to the local SQLite database in the `initDb()` function. The creation query will be:

```sql
CREATE TABLE IF NOT EXISTS restore_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dump_file TEXT NOT NULL,
  connection_name TEXT NOT NULL,
  dbname TEXT NOT NULL,
  schema TEXT NOT NULL,
  restored_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> **Architecture Note**: According to the PostgreSQL schema governance rules, the default or reference schema must always be `Cambalhota` and never `public`.

### 2.2. TUI Formatting and Layout (`src/tui/app.nim`)
1. **Connection Listing**: The `ListItem` string rendering for connections will change from a raw concatenated string to the intuitive format:
   ```nim
   "[ " & toUpperAscii(c.engine) & " ] DB: " & c.dbname & " | SCHEMA: " & c.schema
   ```
   *(Rendered example: `[ PG ] DB: my_database | SCHEMA: Cambalhota`)*

2. **Backup Location**: The listing of dumps (backup files) will be formatted to include the physical local-origin identifier:
   ```nim
   "[LOCAL] " & d.extractFilename()
   ```

3. **New History Tab**: The restore history will be shown in a new tab in the top menu. We will update the tab list to include:
   ```nim
   let menuItems = @[" 1. Config ", " 2. Backup ", " 3. Restore ", " 4. History "]
   ```
   The navigation and rendering logic in `app.nim` (variable `selectedMenu == 3`) must show a new list component, `listStHistory`, loading the records from the `restore_history` table.

### 2.3. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    CONNECTIONS {
        int id PK
        string name
        string engine
        string host
        int port
        string user
        string dbname
        string schema
        string encrypted_password
        datetime created_at
    }
    RESTORE_HISTORY {
        int id PK
        string dump_file
        string connection_name
        string dbname
        string schema
        datetime restored_at
    }
    
    CONNECTIONS ||--o{ RESTORE_HISTORY : "receives restores (logical)"
```

## 3. Trade-offs
- **Local Storage**: Using the local SQLite database in the `~/.cambalhota/` directory keeps the record tied to the machine where the command ran. Restores done on different machines will not share history.
- **TUI Coupling**: Adding a new tab slightly increases the complexity of the main event loop in `app.nim`.

## 4. Consequences
- Users will have immediate traceability of what was restored and when.
- The user interface will be much cleaner with the standardized formatting for connections and backup origin.
- Easier local audits of who connected and restored backups into which databases and schemas (e.g., `Cambalhota`).

## 5. Status
**Approved** - Ready for tactical execution.
