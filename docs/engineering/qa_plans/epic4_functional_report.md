# Quality Acceptance Dossier - Epic 4 (Migration Engine)
**Status:** QA Approved ✅  
**Date:** 2026-07-17

## 1. Baseline Checks
- [x] The source code was built successfully (`nimble build`).
- [x] The unit test suite was run and passed without failures (`nimble test tmigrations`).
- [x] Assessed the existence and robustness of the checksum validation (SHA-256) (implementation of the `applyMigration` function).
- [x] The `BEGIN/COMMIT` transactional wrapper correctly wraps the execution.

## 2. Gherkin Scenarios

```gherkin
Feature: Integrity Validation by Checksumming
  As an operational tool
  I want to ensure a migration file hasn't been altered after being installed
  So that I can guarantee structural consistency and prevent malicious or accidental corruption

  Scenario: Success on running untouched scripts (Happy Path)
    Given the migration "V20260717162000__create_users.up.sql" is already installed
    And its original checksum is recorded in the "cambalhota_schema_history"
    When the engine triggers a migration apply command
    And it calculates the local file checksum
    Then the calculated checksum must match the database checksum
    And the migration continues successfully or is skipped as already applied

  Scenario: Rejection of corrupted scripts (Error Path)
    Given the migration "V20260717162500__add_email_col.up.sql" was previously installed successfully
    But a developer manually modified the local .sql file to include a malicious DROP statement
    When the engine applies the migrations
    Then the engine computes the SHA-256 hash of the modified file
    And notices a mismatch against the "cambalhota_schema_history" table
    And aborts execution immediately throwing a "MigrationError"
    And preventing any database state modification

Feature: Transactional Protection Mechanisms
  As a database engineer
  I want script executions to be wrapped in transactions
  So that incomplete scripts rollback entirely if there is an error

  Scenario: Auto-wrapping of DDL commands
    Given the migration script contains a syntax error
    When the engine prepares the script for execution
    Then it must prepend "BEGIN;" and append "COMMIT;" to the execution buffer
    And the database driver must automatically trigger a ROLLBACK upon the syntax error
    And the state of the database remains completely unchanged
```

## 3. QA Intervention Report
During the Quality Assurance (QA) process, it was found that, although the atomic logic was present in `src/core/migrations.nim`, the **effective orchestration of the validation** (comparing the hash in the database against the script that ran) was missing and the function was not connected to the CLI TUI (`main.nim`).

The QA team intervened directly, ensuring:
1. Insertion of `applyMigration` with the failure flow (Throw CatchableError) when there is a hash mismatch (`getInstalledChecksum` vs physical file).
2. Replacement in the Controller (`src/main.nim`) pointing to `applyMigration` using the real path and wiring the structural constraint.

The process is now Fail-Safe, confirming the delivery of features 4.1, 4.3 and 4.4.
