## ADR 013: per-machine master key, AES-256-GCM values (v2), legacy migration.
import unittest, os, strutils
import db_connector/db_sqlite
import ../src/db/storage

# Ciphertexts produced by the pre-ADR-013 code (legacy key, AES-256-CTR, zero IV).
const LegacyPassword = "AE8D31347C027EAA872260"
const LegacyPasswordPlain = "s3cr3t-Pa55"
const LegacyCredentials = "A69C33252C132089B97C30AC00DD38FD48F539B281CC29B5742E07142D6D01B89B89B113184FFA30A54F183A5374334F3F08"  # gitleaks:allow (ciphertext of fake test credentials)
const LegacyCredentialsPlain = """{"access_key_id": "AK", "secret_access_key": "SK"}"""

proc freshHome(): string =
  result = getTempDir() / "cambalhota_master_key_test"
  removeDir(result)
  createDir(result)
  putEnv("HOME", result)

suite "Per-machine master key (ADR 013)":
  setup:
    let home = freshHome()

  test "creates a 32-byte master key file readable only by the owner":
    discard encryptPassword("x")
    let keyFile = home / ".cambalhota" / "master.key"
    check fileExists(keyFile)
    check getFileSize(keyFile) == 32
    check getFilePermissions(keyFile) == {fpUserRead, fpUserWrite}
    check getFilePermissions(home / ".cambalhota") == {fpUserRead, fpUserWrite, fpUserExec}

  test "reuses the same key across calls":
    let encrypted = encryptPassword("same-key")
    let keyBefore = readFile(home / ".cambalhota" / "master.key")
    check decryptPassword(encrypted) == "same-key"
    check readFile(home / ".cambalhota" / "master.key") == keyBefore

  test "new values are v2 with a random nonce and round-trip":
    let a = encryptPassword("secret")
    let b = encryptPassword("secret")
    check a.startsWith("v2:")
    check a != b
    check decryptPassword(a) == "secret"
    check decryptPassword(b) == "secret"
    check encryptPassword("") == ""
    check decryptPassword("") == ""

  test "a changed v2 value fails the integrity check":
    let encrypted = encryptPassword("secret")
    let last = encrypted[^1]
    let tampered = encrypted[0 ..< ^1] & (if last == '0': '1' else: '0')
    expect ValueError:
      discard decryptPassword(tampered)

  test "a value from another machine's key fails instead of returning garbage":
    let encrypted = encryptPassword("secret")
    removeFile(getHomeDir() / ".cambalhota" / "master.key")
    expect ValueError:
      discard decryptPassword(encrypted)

  test "legacy values still decrypt":
    check decryptPassword(LegacyPassword) == LegacyPasswordPlain
    check decryptCredentials(LegacyCredentials) == LegacyCredentialsPlain

  test "initDb migrates legacy rows to v2 without changing the plaintext, idempotently":
    initDb()
    let db = open(getDbPath(), "", "", "")
    db.exec(sql"INSERT INTO connections (name, engine, host, port, user, dbname, schema, encrypted_password) VALUES ('c1', 'pg', 'h', 5432, 'u', 'd', 's', ?)", LegacyPassword)
    db.exec(sql"INSERT INTO cloud_providers (id, name, provider_type, encrypted_credentials, metadata) VALUES ('p1', 'n', 's3', ?, '{}')", LegacyCredentials)
    db.close()

    initDb()
    let conn = listConnections()[0]
    let prov = listCloudProviders()[0]
    check conn.encrypted_password.startsWith("v2:")
    check prov.encrypted_credentials.startsWith("v2:")
    check decryptPassword(conn.encrypted_password) == LegacyPasswordPlain
    check decryptCredentials(prov.encrypted_credentials) == LegacyCredentialsPlain

    initDb()
    check listConnections()[0].encrypted_password == conn.encrypted_password
    check listCloudProviders()[0].encrypted_credentials == prov.encrypted_credentials

  test "readSecret reports an unreadable value instead of raising":
    let good = encryptPassword("secret")
    check readSecret(good) == (ok: true, value: "secret")
    check readSecret("") == (ok: true, value: "")
    removeFile(getHomeDir() / ".cambalhota" / "master.key")
    check readSecret(good) == (ok: false, value: "")

  test "a malformed legacy row does not block initDb; good rows still migrate":
    initDb()
    let db = open(getDbPath(), "", "", "")
    db.exec(sql"INSERT INTO connections (name, engine, host, port, user, dbname, schema, encrypted_password) VALUES ('bad', 'pg', 'h', 5432, 'u', 'd', 's', 'ZZ')")
    db.exec(sql"INSERT INTO connections (name, engine, host, port, user, dbname, schema, encrypted_password) VALUES ('good', 'pg', 'h', 5432, 'u', 'd', 's', ?)", LegacyPassword)
    db.close()
    initDb()
    for c in listConnections():
      if c.name == "good":
        check c.encrypted_password.startsWith("v2:")
        check decryptPassword(c.encrypted_password) == LegacyPasswordPlain
      else:
        check c.encrypted_password == "ZZ"
        check readSecret(c.encrypted_password).ok == false

  test "an odd-length legacy value decrypts like the old code (trailing digit ignored)":
    check decryptPassword(LegacyPassword & "A") == LegacyPasswordPlain
