Feature: TUI Concurrency and Streaming (ADR-002)

  As a user of the Cambalhota CLI
  I want the Terminal User Interface (TUI) to remain responsive during heavy I/O operations
  So that I can see real-time progress and logs without the application freezing or crashing

  Background:
    Given the TUI is running using the Tatui framework
    And the architecture uses native threads and Channels for async I/O

  Scenario: Happy Path - Streaming pg_dump logs without blocking TUI
    Given a worker thread is spawned to execute the "pg_dump" subprocess
    When the subprocess streams STDOUT and STDERR chunks
    Then the worker thread sends Msg events through the Channel
    And the TUI main thread polls the Channel without blocking
    And the TUI renders the new log messages in the console panel in real-time
    When the subprocess completes with exit code 0
    Then the TUI notifies the user of success visually (e.g., Green color)
    And the application does not freeze during the entire extraction

  Scenario: Edge Case - High volume of I/O messages
    Given the "pg_dump" subprocess generates dozens of log lines per second
    When the worker thread sends these lines as Msg events to the Channel
    Then the TUI main thread successfully processes the messages via batching or debouncing
    And the TUI remains responsive to user keyboard input
    And the console panel buffer limits the history to avoid memory overflow

  Scenario: Error Case - Subprocess execution fails (Fail-safe)
    Given the worker thread attempts to execute "pg_dump"
    But the command fails (e.g., invalid connection or pg_dump not installed)
    When the subprocess exits with a non-zero exit code
    Then the worker thread sends a Failure message with the error log to the Channel
    And the TUI receives the failure message
    And the TUI stops the execution but remains open (does not crash)
    And the TUI renders the raw error log in the console panel (e.g., Red color) for user inspection
    And the user must explicitly close the TUI, guaranteeing the error was visible
