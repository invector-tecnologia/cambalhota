# UX Report - Switching Between Databases (v1.0.1)

## Context
With the introduction of multiple connections, the information architecture of the Cambalhota TUI requires a refactoring focused on the clarity of the active context (Source vs. Target).

## Interface Changes (Tabs and Panels)

1. **Fixed Header (Global):**
   - The top-left corner consolidates the visual identity with the Retrowave ASCII logo.
   - The top-right corner must serve as a "Status Bar", showing the number of registered connections.

2. **New "Connections" Tab:**
   - **View:** A clear table showing: Name, Engine (PG, MySql, etc) and Host.
   - **Interaction:** Overlaid modal forms for entering new credentials, avoiding abrupt screen switches.

3. **"Backup" Tab Flow:**
   - Before starting the extraction, the user is required to focus and confirm the "Source Database".
   - Interrupting the flow with messages such as "Select a Source" prevents extractions from the wrong databases.

4. **"Restore (Cross)" Tab Flow:**
   - **Cognitive Separation:** The panel will be split. Left side: "What?" (Dump Selection). Right side: "Where to?" (Target Database Selection).
   - This "side-by-side" format maps perfectly onto the mental model of the cross restore.

5. **Error Handling:**
   - In case of a decryption (AES) failure or a rejected connection, error modals will guide the user back to the Connections Tab for correction.
