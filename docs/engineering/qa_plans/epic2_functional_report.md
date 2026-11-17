# Epic 2: Functional Test Report (TUI & Concurrency)

## Overview
This report details the exploratory functional tests run on the `cambalhota` executable to validate the implementation of the Terminal User Interface (TUI) and the concurrency isolation with the subprocess, referenced in **ADR-002**.

## 1. Build and Unit Tests
- **Build (`nimble build`)**: Success. The `./cambalhota` binary compiles without errors (C backend, multithreading enabled).
- **Unit Tests (`nimble test`)**: Success. All tests pass, confirming the base stability of the config, checks and extraction worker modules.

## 2. TUI Flow and Resilience Tests

### 2.1 Happy Path (StSuccess)
- **Action:** Run the TUI application in a valid command scenario (currently _hardcoded_ `pg_dump --version`).
- **Result:** The TUI (`tatui`) is instantiated correctly and does not block while the subprocess runs in the _background_. The output (STDOUT) flows through _channels_ and is rendered in real time. The state transitions gracefully to `stSuccess` at the end. 
- **Status:** **PASS** ✅

### 2.2 Subprocess Failure (Fail-safe UI)
- **Action:** Run the TUI forcing a binary failure (e.g., invoking a nonexistent executable).
- **Result:** The worker thread intercepts the exception and sends an `mkError` message through the channel. The TUI receives the event, changes the title to `stError` (red border) and displays the error log in the panel. The main loop does not crash; the interface keeps working while it waits for the user to press 'q'.
- **Status:** **PASS** ✅ (Fully meets the visual _fail-safe_ behavior described in ADR-002).

## 3. Semantic Validation (Bugs Found)

### 🚨 Failure: Missing Validation of the "public" Schema in the CLI
- **Problem:** The specification requires that: *"failures (such as trying to use the public schema) raise fail-safe visual alerts"*. Currently, the `./cambalhota` executable does not parse command-line arguments. In addition, the `src/db/config.nim` file only has a comment about the schema restriction, but no _runtime_ logic raises an error if `schema == "public"` is configured and passed to the extraction layer.
- **Impact:** The utility risks running unauthorized queries on the `public` schema.
- **Suggested Fix (Engineering):** 
  1. Implement argument parsing in the CLI (`std/parseopt`).
  2. Implement the validation in the `initPgConfig` function (or in the CLI initializer) that throws a Critical Error before the database call, triggering the `stError` event in the TUI when the requested schema is `public`.
- **Status:** **PASS** ✅ (Bug fix applied and tested successfully)

### 3.1 Retest (Validation of the ADR-003 Bug Fix)
- **Action:** Run the application through the CLI forcing the schema violation with `./cambalhota --schema public` (and also omitting `--schema` to test the fallback).
- **Result:** The executable now supports CLI arguments. When trying to use the forbidden schema, the _Hard Block_ validation is triggered. The graphical interface (TUI) starts and immediately displays the `stError` error alert with the visual message: `"ERROR: Uso do schema public é proibido"`. The background process aborts safely without triggering `pg_dump`. The fallback when `--schema` is not provided was set to `"Cambalhota"`.
- **Status:** **PASS** ✅

## Conclusion
The base architecture (TUI + Worker Threads with Channels) kept its stability. The technical debt related to the _Hard Block_ of the `public` schema was fully resolved through CLI parameter parsing and the preventive rule coupled to the TUI. The _fail-safe_ safeguards are validated.

**QA Decision:** Approved. Epic 2 was inspected; the resilience and forbidden-schema blocking requirements were met effectively. **QA Pass**.
