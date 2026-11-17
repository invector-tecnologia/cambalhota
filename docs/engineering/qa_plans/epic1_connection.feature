Feature: Connection and Extraction Core (Backup)
  As a DBA or sysadmin using Cambalhota
  I want the system to validate the local dependencies (such as pg_dump) and connect using safe schemas
  So that the extraction process is transparent, fail-safe and free of impact on the database.

  Scenario: Successful validation of system dependencies (Happy Path)
    Given the Cambalhota application is initialized
    And the "pg_dump" utility is installed and available in the operating system PATH
    When the system runs the dependency pre-flight check
    Then the pre-flight check must succeed
    And no exception must be raised
    And the system must allow execution to proceed

  Scenario: pg_dump utility not found on the system (Error Case)
    Given the Cambalhota application is initialized
    And the "pg_dump" utility is NOT available in the operating system PATH
    When the system runs the dependency pre-flight check
    Then the pre-flight check must fail
    And the system must log a friendly semantic error warning about the missing utility
    And the system must adopt a fail-safe posture and prevent any dump attempt that could cause a runtime crash

  Scenario: Initialization of the default PostgreSQL configuration using the Cambalhota schema (Happy Path)
    Given the PostgreSQL initialization configuration
    When the system creates the default `PgConfig` instance
    Then the internal target schema must be strictly "Cambalhota"
    And the target schema must not be "public"
    And the sslMode setting must be "require"

  Scenario: Explicit override of schema and options (Edge Case)
    Given the PostgreSQL initialization configuration
    When the user intentionally overrides the options via a custom PgConfig constructor to use a schema other than "Cambalhota"
    Then the system must honor the override to serve the valid reasons
    But it must keep the essential connection parameters consistent
