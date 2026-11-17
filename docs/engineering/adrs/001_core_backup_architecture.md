# ADR-001: Core Connection and Extraction Architecture (Backup)

- **Status:** Implemented
- **Date:** 2026-07-17

## Context
The core premise of the **Cambalhota** project is to manage backups and restores of database schemas in a fully *fail-safe* way (objective, transparent and secure). For Epics 1 (Configuration and Connection) and 2 (Extraction and Persistence), we need to define the base technology and the architecture through which the application, running as a Terminal User Interface (TUI), will communicate securely with the target PostgreSQL, extract the data and send it to secure remote storage (CDN/S3-compatible). The system must not interrupt or degrade database performance during extraction, especially at peak hours.

## Technical Decision
1. **Base Language and TUI:** The application will be built entirely in **Nim**, using the **Tatuí** library for the terminal interface. Nim was chosen because it produces fast native binaries with low memory usage (minimal overhead) and because it is statically typed, ensuring runtime safety.
2. **Secure Connection:** We will use native Nim drivers to connect over the PostgreSQL protocol (TCP/IP), with mandatory SSL/TLS support to protect data in transit.
3. **Data Extraction (Backup):** Extraction will not be done through manual *selects* in the Nim code (which would be slow and consume a lot of application memory). Cambalhota will orchestrate the execution of the native `pg_dump` tool via `os.execProcess` (or a safe equivalent), streaming the resulting binary output (so RAM does not blow up) directly to the destination.
4. **Remote Persistence:** The *streams* produced by the extraction will be encrypted in transit and sent in chunks to the remote repository (e.g., an S3-compatible API) using secure asynchronous HTTP requests.

## Trade-offs Considered
- **Implementing the dump in the language itself vs. using `pg_dump`:** 
  - *Doing it in Nim:* Would give more control over granular structures, but the cost of development, maintenance and memory usage (loading data into RAM and then saving it) is very high.
  - *Using `pg_dump`:* Loses the fine granularity of intercepting row by row natively in the language, but gains the stability, compression and decades-tested efficiency of the official PostgreSQL utility. **Decision:** `pg_dump`.
- **Single binary vs. Scripting (Python/Bash):** Distributing an interactive TUI application to sysadmins/DBAs in Bash or Python would require complex dependency setup. By compiling with Nim, we ship a static, ready-to-run (*standalone*) binary.

## Consequences
- **Positive:** The binary produced by Nim will be lightweight and extremely fast. Using `pg_dump` will ensure natively consistent backups without absurd application overhead. The Tatuí TUI will allow smooth interactions, giving an immediate sense of a "transparent and fail-safe operation".
- **Negative/Challenges:** The operating system where Cambalhota runs will need the `pg_dump` binary (PostgreSQL client) installed and available in the user's PATH. We will need strict system validations (e.g., checking that `pg_dump` is present and its version) right at application startup (Pre-flight checks).

## References
- Nim documentation: https://nim-lang.org/
- Tatuí library: TUI framework adopted for the objective view.
- Features Map & Roadmap v1.0 (Epics 1 and 2).
