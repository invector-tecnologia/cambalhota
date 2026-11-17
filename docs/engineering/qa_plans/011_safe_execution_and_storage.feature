Feature: Safe Execution and Storage
  As a Cambalhota user
  I want my database backups to be executed safely, confirmed and stored correctly
  So that I do not lose data accidentally, break the terminal rendering or lose files.

  Background:
    Given the Cambalhota TUI is running
    And the application has write permission on "~/.cambalhota/db_dump/"

  Scenario: Canceling a critical action via the confirmation modal
    Given the user starts a "Backup", "Restore" or "Delete" action
    And the Universal Confirmation Modal is displayed on the screen
    When the user presses the "[Esc]" key
    Then the modal must be closed
    And the action must be aborted immediately
    And no backup file must be created or changed in "~/.cambalhota/db_dump/"
    And the terminal rendering state must remain intact without visual corruption

  Scenario: Successful backup execution with storage partitioned by year
    Given the user starts a "Backup" action
    And the Universal Confirmation Modal is displayed on the screen
    When the user confirms the action
    And the backup subprocess is executed
    Then the subprocess stdout must be intercepted asynchronously
    And the intercepted messages must be sent to and displayed in the "logChannel" (Console in the TUI)
    And a physical backup file must be saved successfully
    And the file must be located exactly in the subfolder of the corresponding year, in the format "~/.cambalhota/db_dump/YYYY/"
    And the terminal rendering state must be preserved during and after the execution

  Scenario: Restore or Delete execution does not break the interface
    Given the user starts a "Restore" action
    And the Universal Confirmation Modal is displayed on the screen
    When the user confirms the action
    Then the corresponding action must be executed
    And the subprocess stdout must be intercepted and displayed in the "logChannel"
    And the terminal interface must never lose its rendering state
