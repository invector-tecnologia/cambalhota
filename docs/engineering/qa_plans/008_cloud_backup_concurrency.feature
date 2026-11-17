Feature: Asynchronous Cloud Backup Synchronization (S3)
  As a Cambalhota user
  I want to upload and download backup files to and from the cloud asynchronously
  So that the terminal user interface (TUI) does not freeze during network operations (heavy I/O)

  Scenario: Successful asynchronous backup upload (Happy Path)
    Given the user has configured valid S3 credentials
    And a valid local backup file exists
    When the user triggers the Upload command in the TUI "[U]"
    Then the system must start a Worker Thread for the HTTP Streaming transfer
    And the TUI must keep running (rendering not blocked)
    And the system must update the progress (bytes sent/total) through the Channel communicating with the main thread
    And at the end of the transfer, the TUI must display "Upload completed successfully"
    And the corresponding file must be present in the S3 bucket

  Scenario: Successful asynchronous backup download (Happy Path)
    Given the user has configured valid S3 credentials
    And a valid backup file exists in the remote S3 bucket
    When the user triggers the Download command in the TUI "[D]"
    Then the system must start a Worker Thread to perform the operation
    And the TUI must stay responsive, allowing navigation
    And the download progress must be updated in real time in the TUI via Channel messages (`tryRecv`)
    And at the end of the operation, the TUI must display "Download completed successfully"
    And the downloaded file must be intact on the local disk

  Scenario: Handling a network failure during transfer (Edge Case / Error Path)
    Given the user has started a backup Upload or Download
    But the network connection drops abruptly during the transfer of a chunk
    Then the Worker Thread must catch the exception or timeout failure
    And send an error message (`stError`) through the Channel back to the main thread
    And the TUI must notify the user with "Network connection error"
    And the TUI must not freeze or suffer a fatal failure (crash) during the network timeout

  Scenario: Using invalid S3 keys (Edge Case / Error Path)
    Given the user has configured invalid S3 credentials or keys (AWS Signature V4)
    When the user triggers a cloud operation (Upload or Download)
    Then the remote service must reject the HTTP request (e.g., 403 Forbidden)
    And the Worker Thread must catch this error response
    And notify the TUI main thread via Channel
    And the TUI must display the message "Authentication error: check your S3 credentials"
    And the TUI must remain responsive

  Scenario: Thread Isolation Validation - TUI without freezing (Technical Validation)
    Given an Upload of a large backup (e.g., 1 GB) is in progress
    When the user interacts with the TUI by navigating, resizing or pressing keys
    Then the interface must keep rendering at a minimum of 60fps
    And there must be no input lag caused by network communication (functional thread isolation)
    
  Scenario: Canceling a transfer in progress (Alternative Path)
    Given the user has started an Upload or Download
    And the transfer is still in progress (e.g., 50%)
    When the user presses a command to cancel the operation
    Then the TUI main thread must signal the network Worker Thread (via atomic boolean or cancellation token)
    And the Worker Thread must abort the current chunk and close the connection gracefully
    And the TUI must report "Operation canceled by the user" without hanging
