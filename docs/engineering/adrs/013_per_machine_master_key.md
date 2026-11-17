# 013 - Per-Machine Master Key for the Local Credential Store

**Status**: Accepted

## Context

ADR 009 planned AES-256-GCM with the master key kept outside SQLite, in the OS
keyring. The implementation diverged:

- The master key that encrypts saved database passwords and cloud credentials
  (`src/db/storage.nim`) was a constant in the source code. The repository is
  public, so anyone with a copy of `~/.cambalhota/connections.db` could decrypt
  every stored secret.
- Values used AES-256-CTR with an all-zero IV, so every value shared the same
  keystream and had no integrity check.
- The CLI had a hard-coded default backup key. `runTui` ignores the CLI
  configuration (the TUI uses the connection password as the backup key), so
  that default was dead code, but it still published a key.
- Compiled binaries (`src/main`, `src/db/storage`), a stale `storage.patch`
  and a sample encrypted backup were tracked in git.

The old key and binaries remain in the public git history, so the old key is
treated as burned: it is kept only to read legacy values once.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. OS keyring (ADR 009) | Key never on disk in clear; matches ADR 009 | New native dependency per OS (Secret Service, Keychain, Credential Locker); fails on headless servers without a keyring daemon |
| B. Per-machine key file, `~/.cambalhota/master.key` (0600, folder 0700) | No new dependency; works headless; same threat model as `~/.ssh` keys | Key on disk; protected only by file permissions |
| C. Key from an environment variable | Simple for CI | Easy to leak in shell history and process listings; breaks the TUI flow when unset |

## Decision

Option B now; option A stays the target and can replace the key source later
without changing the value format.

1. **Master key:** 32 random bytes from the OS CSPRNG (`std/sysrand`), created
   on first use at `~/.cambalhota/master.key` with mode 0600; the folder is
   set to 0700. An existing key file with wrong permissions is tightened.
2. **Value format v2:** `v2:` + hex(12-byte random nonce) + hex(ciphertext) +
   hex(16-byte GCM tag), encrypted with AES-256-GCM. A wrong key or a changed
   value fails the tag check and raises an error; it never returns garbage.
3. **Legacy values** (bare hex, no prefix) are decrypted with the burned
   legacy key. `initDb` re-encrypts each legacy value in `connections` and
   `cloud_providers` to v2, row by row; values already in v2 are left alone,
   so the migration is idempotent. An unreadable row stays as it was and
   never blocks startup. Decrypted plaintext is unchanged, so backups that
   used a connection password as their key still restore.
4. **Unreadable values never crash the TUI.** `readSecret` reports them; the
   TUI shows an error, skips the backup/restore/migration, and leaves the
   field empty in the edit form so the user can enter it again.
5. **Master key creation is atomic:** the key is written to a temporary file
   (0600) and linked into place, so a crash never leaves a partial key and a
   concurrent first run keeps a single key.
6. **CLI:** no default backup key.
7. **Repository hygiene:** build outputs and the sample backup are removed
   from the tree and ignored in `.gitignore`.

## Out of scope (follow-up)

The backup file format still uses AES-256-CTR with an all-zero IV, and the TUI
uses the connection password, zero-padded, as the backup key (no key
derivation). A connection without a password therefore produces a backup
encrypted with an all-zero key, which is effectively unencrypted; it is kept
working here so passwordless (trust/peer) connections can still be backed up.
Changing it changes the file format and the restore path of existing
backups, so it needs its own ADR and a migration plan.

Stored values carry no associated data, so someone who can write the database
can swap ciphertexts between rows; binding each value to its row is a
follow-up too.

## Consequences

- Copying `connections.db` to another machine no longer exposes secrets; the
  `master.key` file must be copied with it (and protected like an SSH key).
- Losing `master.key` makes the stored passwords unreadable; the user
  re-enters them. Back it up with the database.
- Tests set `HOME` to a temporary folder, so they never touch the real store.
