# 📦 Release Notes - Cambalhota v1.0.2

This update brings a strong focus on **Quality of Life (QoL)**, delivering an even friendlier terminal interface, optimized flows and greater structural safety on system events.

## ✨ New Features and UX Improvements (QoL)

- **Restore History (Audit Log):** A new tab (`4. History`) was added. Cambalhota now tracks and displays the full history of restored backups, reporting precisely when it was restored, the source file, which database engine and which target schema.
- **Dynamic Quick Guide (Sidebar):** An interactive sidebar was added on the right side of the interface. It shows tutorials and useful shortcuts depending on the active menu, making it much easier for new users without having to consult external manuals.
- **Agile Connection Management:** The Configuration menu (Menu 1) was loaded with productivity:
  - `[E]` **(Edit):** You can now edit the details of an existing connection.
  - `[C]` **(Clone):** New feature to duplicate an existing configuration, ideal for quickly registering a new Schema without retyping host/user/password.
- **Visible Typing Interface:** The TUI forms (such as database entry) now show a retro/hacker typing cursor (`█`). This gives tactile feedback on where your keyboard input is acting.
- **Escaping and Cancellations:** Support for `ESC` and `Ctrl+C` during forms was reinforced, safely aborting edits without trapping the user's state.
- **Clearer Connection Details:** The listing was redesigned to make it obvious, at first glance, which type of database we are talking about. The `[PG]`, `[MYSQL]`, `[SQLITE]` tags, etc., accompany the DB name and the Schema to leave no room for errors during a critical Restore.

## 🐛 Bug Fixes

- **Critical Fix (Terminal Resize Crash):** Fixed an issue where resizing the terminal window caused Cambalhota to close abruptly.
  - *Technical details:* Resizing the terminal emits the native `SIGWINCH` signal, which immediately interrupts IO system calls (`fwrite/fflush`) in progress. The event resulted in `EINTR`, which the stack surfaced as an `IOError`. We implemented a fail-safe vest (`try...except`) in the main renderer, letting the UI absorb the jolt and redraw the buffers instantly once the signal is gone.

## 🤖 Operations

- **Test Suite Organization:** We instructed our QA agents to consolidate and generate test files (.nim) natively centralized and operational from the `/tests/` folder, refining the pipeline and keeping the main repository always clean.
