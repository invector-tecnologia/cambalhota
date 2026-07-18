Feature: TUI Resilience, Cloud Concurrency and Memory State

  Scenario: TUI handles invalid character injection in forms
    Given the TUI is running
    When the user inputs non-ascii characters (e.g. 👾, ã, \0) in the form fields (like connection string or passwords)
    Then the input should be properly sanitized or the field should display a validation error without crashing the application
    And the TUI should remain responsive at 60fps

  Scenario: TUI handles huge paste of data in inputs
    Given the TUI is running
    When the user pastes a 10MB string into an input field
    Then the input should truncate the string or reject the paste
    And memory usage should not spike out of bounds
    And the application should not crash

  Scenario: Restore handles a corrupted dump file
    Given a local database backup dump file exists
    And the dump file is intentionally corrupted by flipping random bits
    When the user selects the file for restoration via the TUI
    Then the background Worker Thread should catch the decryption/decompression or psql execution error
    And it should send an error message via Channel to the TUI
    And the TUI should display a "Critical Error" with the exact failure reason without freezing
    And the database state should ideally rollback or remain untouched

  Scenario: Cloud Backup Upload handles network failure gracefully
    Given the user configures valid Cloud S3 credentials
    And initiates a dump upload to the cloud
    When the network connection drops abruptly mid-transfer
    Then the Cloud Async Engine should detect the timeout or broken pipe
    And it should gracefully cancel the HTTP streaming
    And it should notify the TUI via Channel with a "Network Error" status
    And no thread or memory leak should remain active for that task

  Scenario: Cloud Backup Download handles concurrency limitations
    Given the user initiates a Cloud Backup download
    When the user rapidly triggers multiple upload and download actions simultaneously
    Then the system should either queue the operations or block overlapping actions safely
    And the Nim multithread channels should not deadlock
    And the Tatui framework should continue updating the UI properly

  Scenario: Verify memory leaks over prolonged operation
    Given the TUI is left running
    When background extraction and cloud syncing are triggered repeatedly 100 times
    Then the Nim ORC memory model and `system.Channel` allocations should remain stable
    And the resident set size (RSS) should not grow indefinitely
