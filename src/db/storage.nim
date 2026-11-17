import std/[os, strutils, sysrand, posix]
import db_connector/db_sqlite
import nimcrypto
import std/oids

type
  ConnectionRecord* = object
    id*: int
    name*: string
    engine*: string
    host*: string
    port*: int
    user*: string
    dbname*: string
    schema*: string
    encrypted_password*: string
    createdAt*: string

  RestoreHistoryRecord* = object
    id*: int
    dump_file*: string
    connection_name*: string
    dbname*: string
    schema*: string
    restored_at*: string

  CloudProviderRecord* = object
    id*: string
    name*: string
    provider_type*: string
    encrypted_credentials*: string
    metadata*: string
    created_at*: string
    updated_at*: string

const
  MasterKeyFileName = "master.key"
  MasterKeySize = 32
  NonceSize = 12
  TagSize = 16
  V2Prefix = "v2:"
  # Burned key: it is in the public git history (ADR 013). Used only to read legacy values.
  LegacyMasterKey = "cambalhota_master_key_12345678"

proc cambalhotaDir(): string =
  result = getHomeDir() / ".cambalhota"
  createDir(result)
  setFilePermissions(result, {fpUserRead, fpUserWrite, fpUserExec})

proc createMasterKeyFile(keyFile: string) =
  ## Writes the key to a temporary file first and links it into place, so a
  ## crash never leaves a partial key and a concurrent first run keeps one key.
  var fresh: array[MasterKeySize, byte]
  if not urandom(fresh):
    raise newException(OSError, "Could not read random bytes for the master key")
  let tmpFile = keyFile & ".tmp-" & $getCurrentProcessId()
  block writeTemp:
    let f = open(tmpFile, fmWrite)
    defer: f.close()
    # Restrict the file before any key byte is written.
    setFilePermissions(tmpFile, {fpUserRead, fpUserWrite})
    if f.writeBytes(fresh, 0, MasterKeySize) != MasterKeySize:
      raise newException(IOError, "Could not write the master key file: " & tmpFile)
  defer: removeFile(tmpFile)
  if posix.link(tmpFile.cstring, keyFile.cstring) != 0 and errno != EEXIST:
    raiseOSError(osLastError(), "Could not create the master key file: " & keyFile)

proc masterKey(): array[MasterKeySize, byte] =
  ## Per-machine key (ADR 013): created on first use, readable only by the owner.
  let keyFile = cambalhotaDir() / MasterKeyFileName
  if fileExists(keyFile):
    setFilePermissions(keyFile, {fpUserRead, fpUserWrite})
  else:
    createMasterKeyFile(keyFile)
  let content = readFile(keyFile)
  if content.len != MasterKeySize:
    raise newException(ValueError, "Invalid master key file (expected 32 bytes): " & keyFile)
  copyMem(result[0].addr, content[0].unsafeAddr, MasterKeySize)

proc toHexString(data: openArray[byte]): string =
  for b in data: result &= toHex(int(b), 2)

proc fromHexString(hex: string): seq[byte] =
  if hex.len mod 2 != 0:
    raise newException(ValueError, "Invalid encrypted value: odd hex length")
  result = newSeq[byte](hex.len div 2)
  for i in 0 ..< result.len:
    result[i] = byte(parseHexInt(hex[i*2 .. i*2+1]))

proc decryptLegacy(encryptedHex: string): string =
  ## Pre-ADR-013 values: AES-256-CTR, zero IV, legacy key.
  var key: array[32, byte]
  for i in 0..<min(LegacyMasterKey.len, 32): key[i] = byte(LegacyMasterKey[i])
  var iv: array[16, byte]
  var ctx: CTR[aes256]
  ctx.init(key, iv)
  # The old code ignored an odd trailing hex digit; keep that behavior.
  let ct = fromHexString(encryptedHex[0 ..< encryptedHex.len - encryptedHex.len mod 2])
  var pt = newSeq[byte](ct.len)
  if ct.len > 0: ctx.decrypt(ct, pt)
  ctx.clear()
  result = newString(pt.len)
  for i, b in pt: result[i] = char(b)

proc isLegacyValue(value: string): bool =
  value != "" and not value.startsWith(V2Prefix)

proc getDbPath*(): string =
  result = cambalhotaDir() / "connections.db"

proc migrateLegacyValues(db: DbConn)

proc initDb*() =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  db.exec(sql"""
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      engine TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      user TEXT NOT NULL,
      dbname TEXT NOT NULL,
      schema TEXT NOT NULL DEFAULT 'Cambalhota',
      encrypted_password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  """)
  db.exec(sql"""
    CREATE TABLE IF NOT EXISTS restore_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dump_file TEXT NOT NULL,
      connection_name TEXT NOT NULL,
      dbname TEXT NOT NULL,
      schema TEXT NOT NULL,
      restored_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  """)
  db.exec(sql"""
    CREATE TABLE IF NOT EXISTS cloud_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      provider_type TEXT NOT NULL,
      encrypted_credentials TEXT NOT NULL,
      metadata TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  """)
  migrateLegacyValues(db)

proc encryptPassword*(password: string): string =
  ## AES-256-GCM with a random nonce: "v2:" & hex(nonce & ciphertext & tag).
  if password == "": return ""
  var nonce: array[NonceSize, byte]
  if not urandom(nonce):
    raise newException(OSError, "Could not read random bytes for the nonce")
  let key = masterKey()
  var ctx: GCM[aes256]
  ctx.init(key, nonce, [])
  var pt = newSeq[byte](password.len)
  for i in 0..<password.len: pt[i] = byte(password[i])
  var ct = newSeq[byte](pt.len)
  var tag: array[TagSize, byte]
  ctx.encrypt(pt, ct, tag)
  ctx.clear()
  result = V2Prefix & toHexString(nonce) & toHexString(ct) & toHexString(tag)

proc decryptPassword*(encryptedHex: string): string =
  ## Reads v2 values and, for migration, legacy values. Raises ValueError when
  ## the value was changed or was encrypted with another machine's key.
  if encryptedHex == "": return ""
  if isLegacyValue(encryptedHex): return decryptLegacy(encryptedHex)
  let raw = fromHexString(encryptedHex[V2Prefix.len .. ^1])
  if raw.len <= NonceSize + TagSize:
    raise newException(ValueError, "Invalid encrypted value: too short")
  let nonce = raw[0 ..< NonceSize]
  let ct = raw[NonceSize ..< raw.len - TagSize]
  let tag = raw[raw.len - TagSize .. ^1]
  let key = masterKey()
  var ctx: GCM[aes256]
  ctx.init(key, nonce, [])
  var pt = newSeq[byte](ct.len)
  let authentic = ctx.decrypt(ct, pt, tag)
  ctx.clear()
  if not authentic:
    raise newException(ValueError, "Encrypted value failed the integrity check (changed, or another machine's master key)")
  result = newString(pt.len)
  for i, b in pt: result[i] = char(b)

proc readSecret*(encrypted: string): tuple[ok: bool, value: string] =
  ## For the UI: an unreadable value (lost master key, changed or malformed
  ## value) is reported instead of raised, so the user can re-enter it.
  try:
    result = (ok: true, value: decryptPassword(encrypted))
  except ValueError:
    result = (ok: false, value: "")

proc migrateLegacyValues(db: DbConn) =
  ## ADR 013: re-encrypts legacy values with the per-machine key, once. Each
  ## row is updated on its own; an unreadable row stays as it was (the UI
  ## reports it and the user re-enters it) and never blocks startup.
  for (table, column, idColumn) in [("connections", "encrypted_password", "id"),
                                    ("cloud_providers", "encrypted_credentials", "id")]:
    for row in db.getAllRows(sql("SELECT " & idColumn & ", " & column & " FROM " & table)):
      if not isLegacyValue(row[1]): continue
      try:
        db.exec(sql("UPDATE " & table & " SET " & column & " = ? WHERE " & idColumn & " = ?"),
          encryptPassword(decryptLegacy(row[1])), row[0])
      except ValueError:
        discard

proc saveConnection*(rec: ConnectionRecord) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  let encPw = encryptPassword(rec.encrypted_password)
  db.exec(sql"INSERT INTO connections (name, engine, host, port, user, dbname, schema, encrypted_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    rec.name, rec.engine, rec.host, rec.port, rec.user, rec.dbname, rec.schema, encPw)

proc updateConnection*(id: int, rec: ConnectionRecord) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  let encPw = encryptPassword(rec.encrypted_password)
  db.exec(sql"UPDATE connections SET name = ?, engine = ?, host = ?, port = ?, user = ?, dbname = ?, schema = ?, encrypted_password = ? WHERE id = ?",
    rec.name, rec.engine, rec.host, rec.port, rec.user, rec.dbname, rec.schema, encPw, id)

proc listConnections*(): seq[ConnectionRecord] =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  for row in db.fastRows(sql"SELECT id, name, engine, host, port, user, dbname, schema, encrypted_password, created_at FROM connections"):
    result.add ConnectionRecord(
      id: parseInt(row[0]),
      name: row[1],
      engine: row[2],
      host: row[3],
      port: parseInt(row[4]),
      user: row[5],
      dbname: row[6],
      schema: row[7],
      encrypted_password: row[8],
      createdAt: row[9]
    )

proc deleteConnection*(id: int) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  db.exec(sql"DELETE FROM connections WHERE id = ?", id)

proc saveRestoreHistory*(rec: RestoreHistoryRecord) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  db.exec(sql"INSERT INTO restore_history (dump_file, connection_name, dbname, schema) VALUES (?, ?, ?, ?)",
    rec.dump_file, rec.connection_name, rec.dbname, rec.schema)

proc listRestoreHistory*(): seq[RestoreHistoryRecord] =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  for row in db.fastRows(sql"SELECT id, dump_file, connection_name, dbname, schema, restored_at FROM restore_history ORDER BY id DESC"):
    result.add RestoreHistoryRecord(
      id: parseInt(row[0]),
      dump_file: row[1],
      connection_name: row[2],
      dbname: row[3],
      schema: row[4],
      restored_at: row[5]
    )

proc encryptCredentials*(credsJson: string): string =
  return encryptPassword(credsJson)

proc decryptCredentials*(encryptedHex: string): string =
  return decryptPassword(encryptedHex)

proc saveCloudProvider*(rec: var CloudProviderRecord) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  if rec.id == "": rec.id = $genOid()
  let encCreds = encryptCredentials(rec.encrypted_credentials)
  db.exec(sql"INSERT INTO cloud_providers (id, name, provider_type, encrypted_credentials, metadata) VALUES (?, ?, ?, ?, ?)",
    rec.id, rec.name, rec.provider_type, encCreds, rec.metadata)

proc updateCloudProvider*(id: string, rec: CloudProviderRecord) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  let encCreds = encryptCredentials(rec.encrypted_credentials)
  db.exec(sql"UPDATE cloud_providers SET name = ?, provider_type = ?, encrypted_credentials = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    rec.name, rec.provider_type, encCreds, rec.metadata, id)

proc listCloudProviders*(): seq[CloudProviderRecord] =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  for row in db.fastRows(sql"SELECT id, name, provider_type, encrypted_credentials, metadata, created_at, updated_at FROM cloud_providers"):
    result.add CloudProviderRecord(
      id: row[0],
      name: row[1],
      provider_type: row[2],
      encrypted_credentials: row[3],
      metadata: row[4],
      created_at: row[5],
      updated_at: row[6]
    )

proc deleteCloudProvider*(id: string) =
  let db = open(getDbPath(), "", "", "")
  defer: db.close()
  db.exec(sql"DELETE FROM cloud_providers WHERE id = ?", id)
