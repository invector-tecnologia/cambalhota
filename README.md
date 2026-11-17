<div align="center">
<pre style="line-height: 1.1; font-family: monospace; color: #FF00FF; font-weight: bold; text-shadow: 0 0 5px #FF00FF;">
  ████    █████   ███   ███  ██████    █████   ██       ██   ██   ██████   ████████   █████  
 ██  ██  ██   ██  ████ ████  ██   ██  ██   ██  ██       ██   ██  ██    ██     ██     ██   ██ 
 ██      ███████  ██ ███ ██  ██████   ███████  ██       ███████  ██    ██     ██     ███████ 
 ██  ██  ██   ██  ██  █  ██  ██   ██  ██   ██  ██       ██   ██  ██    ██     ██     ██   ██ 
  ████   ██   ██  ██     ██  ██████   ██   ██  ███████  ██   ██   ██████      ██     ██   ██ 
</pre>
  <h3>The Database Swiss Army Knife</h3>
  <p>Native, ultra-fast, encrypted, terminal-UI-driven (TUI) database version control.</p>
</div>

<br />

**Cambalhota** is not just another database manager; it is a complete platform built in **Nim** that abstracts away the chaos of managing *dumps*, *restores* and *migrations*. It focuses on local at-rest security, tolerance to RAM bottlenecks and a *Retrowave* visual experience right in your terminal.

## 🌟 Key Features (v1.0.1)

### 1. 🛡️ Local-First Security (Epic 7)
Never again leave a readable dump on your machine. Cambalhota exports and saves files locally in the `~/.cambalhota/db_dumps/YYYY/` folder.
Before touching the disk, every byte is compressed *on-the-fly* via **Zippy** and shielded with military-grade **AES-256 CTR** encryption using `nimcrypto`. Your data at rest is 100% protected against unauthorized extraction.

### 2. 🌊 Restore Engine & Anti-OOM Reverse Mechanics (Epic 3)
Restoring a database of hundreds of gigabytes does not have to freeze your machine.
Cambalhota works by injecting blocks directly (`stdin`) while consuming very little RAM (*O(1)*). It decrypts the blocks, inflates them and streams the clean output uninterruptedly to CLIs such as `psql` and `mysql`, while reporting the *Megabytes* injected. In addition, strict rules prevent accidental injection over the `public` schema (Active Fail-Safe).

### 3. 📜 Transactional Migration Engine (Epic 4)
The Cambalhota core works much like *Flyway* or *Liquibase*, validating migration scripts (`up/down` with the `VYYYYMMDDHHMM__slug.sql` naming pattern):
- **Checksumming (SHA-256):** The engine validates logical integrity by comparing the HASH of the current file against the local table (`Cambalhota.cambalhota_schema_history`). If a single comma changed in an already applied file, the process is fully aborted.
- **Transactional Isolation:** Every script executed on your database is automatically wrapped in a `BEGIN` and `COMMIT` envelope. If a syntax error occurs on line 40, the whole script is rolled back and the DBMS consistency is preserved (on supported engines).

### 4. 📺 Tatuí TUI (Epic 5)
No more staring at log screens scrolling out of control or frozen. *Cambalhota* uses the **Tatuí** library to give you a responsive multithreaded environment:
- Isolated tabs and panels for settings, local backups, history and File Viewer.
- Browse your local scripts, read all the code in the TUI and apply your migrations by pressing `Enter`. 
- Non-blocking logging via *Channels*, providing continuous progress bars immune to the weight of disk/database I/O processing.

### 5. 🗄️ Secure Multi-Connections & Cross-Restore (v1.0.1)
No more `.env` mess! Cambalhota manages multiple database connections directly in the interface, storing AES-encrypted passwords in a hidden SQLite database (`~/.cambalhota/connections.db`).
Thanks to the `Restore` tab with a *side-by-side* layout, you can take the dump of a local server and restore it straight into a remote cloud database, bridging both ends with minimal clicks.

---

## 🚀 Installation (One-Liner)

If you want to jump straight into action and install the native utility on your machine, run:

```bash
curl -sSL https://github.com/invector-tecnologia/cambalhota/releases/download/v1.0.0/install.sh | bash
```

*Note: The script downloads the freshly compiled binary from our [Releases](https://github.com/invector-tecnologia/cambalhota/releases) page and installs it in `/usr/local/bin`.*

---

## 📖 How to Use (Definitive Guide)

### 1. Invoking the Engine
Just call `cambalhota` from inside your project directory, where your configuration files or the `migrations/up/` folder live.
```bash
cambalhota
```

### 2. Connection Management (TUI SQLite)
Unlike traditional utilities, we do not require environment variables to be set.
When the application starts, go to the **Config** tab, press the add command and enter the database details (Host, Port, Engine, Credentials).
- Every password you type is shielded and AES-encrypted before touching the disk.
- You can register dozens of connections and, at Backup or Restore time, the interactive panel asks you to pick the Source and Target server with a simple arrow-key press!

### 3. Navigation (Keybinds)
- `Left / Right`: Switches the tabs at the top of the application (Config -> Backup -> Restore / Migrations).
- `Up / Down`: Selects a file listed in the *History / Actions* panel.
- `Enter`: Runs a primary action on the file (for example, reading the SQL script and firing the Migration Engine).
- `Ctrl + Q`: Gracefully exits the utility, aborting zombie processes.

### 4. Structuring Your Local Migrations
The engine (Epic 4) scans the SQL files in `migrations/up/`. The naming rule must be followed so the tool understands the universal chronology:
```
V20260717164800__create_users_table.up.sql
V20260717170000__add_tenant_id_to_users.up.sql
```
- The letter `V` followed by the Timestamp is vital (it guarantees order and mathematical *sorting*).
- The double `__` character separates the version from the slug.

---

## 🛠️ For Developers (Building Locally)
Cambalhota is built entirely in [Nim](https://nim-lang.org/). If you want to play with the architecture and inject your own ADRs:

1. Make sure `nim` and `nimble` (package manager) are installed:
   ```bash
   curl https://nim-lang.org/choosenim/init.sh -sSf | sh
   ```
2. Clone the repository:
   ```bash
   git clone https://github.com/invector-tecnologia/cambalhota.git
   cd cambalhota
   ```
3. Build the application with the most aggressive release flag (Release C Backend):
   ```bash
   nimble build -y -d:release
   ```
4. Run it with:
   ```bash
   ./cambalhota
   ```

---
*Cambalhota - Because managing schemas and holding your data together never had to be painful.*
