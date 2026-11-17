# 009 - Flexible and Secure Storage of Cloud Credentials

**Status**: Implemented
## Context

The user approved the UX flow for managing Cloud provider settings in Cambalhota. The architecture must support a growing, heterogeneous list of providers, such as AWS, MinIO, R2, Git, Google Drive, Dropbox, OneDrive and Apple Cloud. Each provider has its own authentication mechanism: S3-like providers require *Access Keys*, while virtual-drive or Git-based providers usually use *OAuth Tokens* or SSH keys/PATs. In addition, these credentials are highly sensitive and must be persisted in the local environment in a unified, secure way.

## Decision

1.  **`cloud_providers` Table in the Local SQLite:**
    Add a new entity to the existing SQLite database (`connections.db`) dedicated to mapping and storing backup/cloud provider settings.
    *Suggested schema:*
    - `id` (UUID): Primary key.
    - `name` (String): Friendly name defined by the user to identify the configuration.
    - `provider_type` (String): The provider type/engine (e.g., `aws`, `minio`, `git`, `google_drive`, etc.).
    - `encrypted_credentials` (Blob/Text): The payload with the structured credential, encrypted *at rest*.
    - `metadata` (Text): A structured JSON with non-sensitive provider data (e.g., `bucket_name`, `region`, `endpoint_url`, `repository_url`).
    - `created_at` / `updated_at`: Audit control.

2.  **Payload Flexibility via JSON:**
    Both the `metadata` field and the original data that makes up the credentials will be JSON objects. This absorbs the heterogeneity of authentication methods without forcing constant changes to the SQLite DDL when a new provider is added.
    - *S3 example:* `{"access_key_id": "...", "secret_access_key": "..."}`
    - *OAuth example:* `{"access_token": "...", "refresh_token": "...", "client_id": "...", "expiry": "..."}`
    - *Git example:* `{"ssh_private_key": "..."}` or `{"personal_access_token": "..."}`

3.  **Security (Symmetric Encryption):**
    Before saving the JSON payload in `encrypted_credentials`, the `ConfigManager` will serialize and encrypt the full string with AES-256-GCM. 
    Following the design established for the local database connections, the **Master Key** (encryption key) will not be stored in SQLite; it is delegated to the native **OS Keyring** of the user's machine (Keychain on macOS, Secret Service on Linux, Credential Locker on Windows).

## Trade-offs

-   **Pros:** JSON-based modeling provides maximum extensibility to support dozens of clouds in the future without breaking table consistency. Encrypting the JSON as a single payload is computationally fast and simplifies the persistence layer in Nim.
-   **Cons:** It is not possible to search, index or apply granular SQL constraints directly on the inner fields of credentials or metadata (since the first is encrypted and the second is a JSON BLOB/String). However, queries in the Core Engine will always search by `id` or `provider_type`, which fully mitigates this problem and makes the trade-off highly favorable.

## Consequences

-   The Data Access layer (DAO) in Nim must be extended to support CRUD operations on the new `cloud_providers` table.
-   The `std/json` (de)serialization logic must be integrated into the `nimcrypto` flows before the data is flushed to the local database, for correct table management and *on-the-fly* retrieval via Worker Thread.
-   The architecture map (and the `ConfigManager`) takes on the responsibility of orchestrating not only DBMS credentials but now also long-term Cloud/Repository credentials.
