Feature: Secure Cloud Credentials Management
  As a Cambalhota user
  I want to manage my Cloud provider credentials through the TUI
  So that the system can access my providers (S3, Git, OAuth, etc.) securely, with flexible and encrypted storage

  Scenario: [Happy Path] Successfully creating a new S3 provider through the TUI
    Given I am in the "Cloud Providers" management TUI
    When I choose to add a new provider of type "s3"
    And I fill in the name with "My AWS Bucket"
    And I fill in the metadata with the region and bucket information
    And I fill in the credentials with "Access Key" and "Secret Key"
    And I save the configuration
    Then the TUI displays a success message
    And the record "My AWS Bucket" is persisted in the "cloud_providers" table of the "connections.db" database
    And the JSON in the "encrypted_credentials" field must be encrypted (AES-256-GCM) and not readable in the database
    And the Master Key used is not saved in SQLite, but delegated to the OS Keyring

  Scenario: [Happy Path] Reading and viewing a Cloud provider in the TUI
    Given a provider "Google Drive" of type "oauth" exists with credentials saved in SQLite
    When I open the provider list in the TUI and select "Google Drive"
    Then the system decrypts the credentials JSON transparently via the Master Key from the OS Keyring
    And the TUI displays the provider metadata and non-sensitive information (without exposing passwords or tokens directly in plain text)

  Scenario: [Happy Path] Updating the credentials of a Cloud provider in the TUI
    Given a provider "Git Backup" of type "git" exists
    When I choose to update the "Personal Access Token" of this provider through the TUI
    And I enter the new valid credential
    And I confirm the changes
    Then the ConfigManager encrypts the new token in JSON 
    And updates the "encrypted_credentials" field in the database without changing the primary key
    And the TUI displays a successful update

  Scenario: [Happy Path] Deleting a Cloud provider through the TUI
    Given a provider "MinIO Backup" is saved in the database
    When I delete the provider "MinIO Backup" in the TUI
    And I confirm the permanent deletion
    Then the record is completely removed from the "cloud_providers" table
    And the provider list in the TUI no longer contains this item

  Scenario: [Error] Read failure due to corrupted credentials JSON
    Given the data in the "encrypted_credentials" or "metadata" column of a provider has been corrupted in the local SQLite
    When the system (ConfigManager) tries to load or the user tries to view the credentials of this provider
    Then the AES-256-GCM decryption or the std/json deserialization will fail
    And the system must not suffer a fatal crash
    And the TUI must warn the user that "The provider credentials are corrupted or tampered with. Please configure them again."

  Scenario: [Alternative] Attempt to create a provider without the required metadata of the specific provider
    Given I am adding a provider of type "s3"
    When I leave the "metadata" JSON incomplete (e.g., missing "region" or "endpoint_url")
    And I fill in the credentials correctly
    And I try to save
    Then the TUI does not allow saving
    And it signals that required metadata parameters are missing for this provider type.
