# QA Functional Report - Epic 3 (Restore Engine and Local Listing)

**Date:** 2026-07-17
**Reference:** [ADR 005 - Restore Engine, Anti-OOM Reverse Mechanics and Local Listing](../adrs/005_restore_engine_and_local_listing.md)
**Epic Status:** [Done] [QA Approved]

## 1. Validation Summary (QA Pass)
The implementation designed by Engineering based on **ADR 005** was inspected. The code and the integrated tests ensure compliance of the listing features for the local directory `~/.cambalhota/db_dumps/YYYY/` and of the OOM-safe Restore through the reverse pipeline.

Findings:
1. **Listing Stability (`listLocalBackups`)**: The correct retrieval of files with the `.enc` extension was validated locally.
2. **Anti-OOM Resilience in Restore**: The reverse mechanics use native block reads (size derived from the format and 4-byte headers) coupled with `nimcrypto` and `zippy`, passing the results to the STDIN of utilities such as `psql`, consuming *O(1)* memory regardless of the final size.
3. **Thread Communication (TUI Notifier)**: Confirmed the use of Channels reporting `mkLog` to the main thread every few dozen processed blocks, enabling smooth progress bars without freezing Tatuí.
4. **Business Rules Check**: Use of the `public` schema is strictly forbidden in the code (raises `ValueError`).

The automated test package (`nimble test trestore`) runs simulated scenarios proving the robustness of the exit codes and the redirection of the streams without loss.

---

## 2. Test Scenarios (Gherkin)

**Feature:** Restore Engine Anti-OOM

  **Scenario:** Successful Full Restore (Happy Path)
    **Given** valid backup files exist in the directory `~/.cambalhota/db_dumps/2026/`
    **And** the user configures the connection with a valid schema (other than `public`)
    **When** the restore process starts for the chosen file
    **Then** the worker will read the file as a continuous stream
    **And** the decrypted and decompressed data will be piped successfully to the `stdin` of the CLI (`psql`, `mysql`, etc)
    **And** the TUI Thread will receive continuous reports on the processed bytes
    **And** the final status will be success (QA Approved).

  **Scenario:** Restore interrupted by an invalid schema (Semantic)
    **Given** the user tries to configure the restore for the database
    **When** they set the schema field explicitly to "public"
    **Then** the validation worker must raise an error immediately
    **And** the underlying DBMS will not be invoked
    **And** the TUI panel must report that "Uso do schema public é proibido".

  **Scenario:** DBMS tool missing from the OS
    **Given** the operating system does not have the native utility (`psql` or `mysql`)
    **When** the worker tries to invoke `osproc.startProcess`
    **Then** an error (such as File not found) must be caught 
    **And** wrapped in an Error message in the `logChannel` in a controlled way, without causing a Segmentation Fault in the TUI.

  **Scenario:** DBMS Exit Code Failure (Database Error)
    **Given** the extraction has started the dump
    **When** the database CLI (e.g., `psql`) returns an Exit Code other than 0 (due to DB permission restrictions)
    **Then** the restore pipeline reports the event as a Failure
    **And** sends `mkError` containing "Restore process exited with code X" to the TUI.

  **Scenario:** `.enc` File Corruption and Block Break (Edge Case)
    **Given** a backup modified or truncated manually in the local directory
    **When** the Restore Engine reads the block headers (`len`) and requests bytes 
    **Then** the engine will notice a read shorter than the declared length
    **And** it will fail with the semantic error "Arquivo corrompido, bloco incompleto".

---

## 3. Conclusions and Certification

Epic 3 fully meets the product specification and the technical engineering outlined:
- Block-oriented reading proved to be safe against Out of Memory.
- The returns through `logChannel` feed the interface in a thread-safe way.
- Exit codes and anomalous read behaviors (EOF and block-length) were translated into visual feedback for the user, fulfilling the fail-safe promise.

*Signed by the QA Agent*
