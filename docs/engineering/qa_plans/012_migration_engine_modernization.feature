Feature: Migration Engine Modernization
  As a user of the Cambalhota TUI
  I want to manage and run database migrations from a unified tab
  So that I do not need environment variables and have a consistent and safe visual experience

  Background:
    Given the main TUI application (`src/tui/app.nim`) is running
    And the user has navigated to the "Migrations" tab

  Scenario: Successful migration execution (Happy Path)
    Given the database credentials are configured in the local SQLite database
    And there are pending migrations for the database
    When the user requests the execution of the migrations
    Then a Universal Confirmation Modal (ADR 011) must be displayed
    When the user confirms the operation in the modal
    Then the migration execution must start in an asynchronous thread
    And the continuous migration log must be rendered in real time in the `bodyRect` area
    And when it finishes, a success message must be displayed

  Scenario: Migration attempt without credentials in the SQLite database
    Given the local SQLite database has no database credentials configured
    When the user requests the execution of the migrations
    Then an Error Modal must be displayed stating that the credentials are missing
    And the migration must not be started

  Scenario: Migration failure with a corrupted database (Edge Case)
    Given the credentials are correct in the local SQLite database
    And the user has confirmed the migration execution
    And the migration execution has started in an asynchronous thread
    When a database corruption or integrity error occurs while the scripts are applied
    Then the asynchronous thread must catch the exception safely
    And the migration transaction must be rolled back
    And the detailed error must be printed to the continuous log inside the `bodyRect` area
    And a Critical Error Modal must be displayed reporting the failure
    And the main TUI must not freeze or crash

  Scenario: Canceling the migration in the Confirmation Modal
    Given the user has requested the execution of the migrations
    And the Universal Confirmation Modal has been displayed
    When the user chooses the cancel option
    Then the modal must be closed
    And no migration must be executed
    And the interface must return to the previous state in the "Migrations" tab
