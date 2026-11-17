# ADR 011: Safe Execution & Storage (Visual Console and YYYY Policy)

**Status:** Implemented

## Context
The Product Agent required the complete removal of `term.restore()` and unmanaged terminal output, moving to contextual overlay confirmation modals and a Visual Console integrated into the TUI (in `bodyRect`). Previously, running external utilities (such as `pg_dump`) could lock the render thread or garble the screen by printing output directly to the host terminal stdout.
In addition, as the number of dumps produced by Cambalhota keeps growing, a more scalable, organized and performant method is needed to store files in the local file system (FileSystem).

## Decision

### 1. Asynchronous Stdout Capture and Visual Console
External subprocesses (such as `pg_dump`, `mysqldump`, via Nim's `osproc` module) will run asynchronously, capturing their standard streams (`stdout` and `stderr`) through streams/pipes read in real time by **worker threads**.
- **Worker Threads and Streaming:** The worker thread will call `startProcess` (with the appropriate options, such as `poUsePath`, `poStdErrToStdOut`, etc.) and read the output continuously via `outputStream`.
- **Safe Communication:** Each log line or block read will be wrapped in a string (or a matching record) and forwarded to the existing communication channel (`logChannel: Channel[string]`).
- **Non-blocking Rendering:** The TUI, in its main *event loop*, will periodically consume (using `tryRecv()`) the messages from `logChannel` and append them to the Console widget (placed inside `bodyRect`). This keeps the UI from "freezing" during heavy dumps, provides modern visual feedback and removes the need for the problematic `term.restore()`.

### 2. New Strict FileSystem Policy (Storage by Year - `YYYY`)
Creation and organization of local dumps now follow a structure strictly partitioned by yearly directory:
- **Mandatory Path:** `~/.cambalhota/db_dump/YYYY/` (where YYYY is the year the dump was generated, e.g., `~/.cambalhota/db_dump/2026/`).
- At backup time, the Cambalhota engine will check and create the subdirectory for the current year (taken from the running timestamp) before instantiating the dump file or stream.
- **Optimized Reading (Restore Tab):** The dump listing utility (in the TUI Restore tab) will be refactored to focus the scan on the current/specific year directory. It can navigate to previous years on demand (via the UI, such as a combobox), limiting disk reads and saving CPU/memory time instead of recursively listing thousands of unnecessary files.

## Trade-offs
- **IO and Memory Complexity:** Properly managing and cleaning up process and pipe instances inside worker threads, combined with Nim's ORC architecture, requires extra attention to *memory leaks* from unclosed OS handles.
- **UI State Management:** The internal Console will store large volumes of strings as the log grows, requiring a *scrollback limit* or *ring buffer* policy in the UI so the screen does not drop render frames because of component tree overload.
- **Limited File Navigation:** Restricting to yearly directories forces the Restore tab to properly manage user navigation in "pages" per year, adding complexity to search when the user does not know the exact year of a backup.

## Consequences
- No more visual corruption or forced "clears" in the host terminal, aligning the architecture with the robust, fluid design required for modern interfaces.
- Orchestrating asynchronous stream reads perfectly isolates the subprocess timing, which makes it easier to implement cancel buttons or immediate abort by the user at any time.
- When scaling to hundreds or thousands of backups produced by daily and yearly routines, the application stays fast when opening the "Restore" tab, keeping the software reliable for users and corporate servers (avoiding huge scans of a single flat directory).
