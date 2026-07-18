import std/[os, strutils]
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

const MasterKey = "cambalhota_master_key_12345678" # 32 bytes for AES-256

proc getDbPath*(): string =
  let dir = getHomeDir() / ".cambalhota"
  createDir(dir)
  result = dir / "connections.db"

proc initDb*() =
  let db = open(getDbPath(), "", "", "")
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
  db.close()

proc encryptPassword*(password: string): string =
  if password == "": return ""
  var key: array[32, byte]
  for i in 0..<min(MasterKey.len, 32): key[i] = byte(MasterKey[i])
  var iv: array[16, byte]
  var ctx: CTR[aes256]
  ctx.init(key, iv)
  var pt = newSeq[byte](password.len)
  for i in 0..<password.len: pt[i] = byte(password[i])
  var ct = newSeq[byte](password.len)
  ctx.encrypt(pt, ct)
  ctx.clear()
  
  var hex = ""
  for b in ct: hex &= toHex(int(b), 2)
  return hex

proc decryptPassword*(encryptedHex: string): string =
  if encryptedHex == "": return ""
  var key: array[32, byte]
  for i in 0..<min(MasterKey.len, 32): key[i] = byte(MasterKey[i])
  var iv: array[16, byte]
  var ctx: CTR[aes256]
  ctx.init(key, iv)
  
  var ct = newSeq[byte](encryptedHex.len div 2)
  for i in 0..<ct.len:
    ct[i] = byte(parseHexInt(encryptedHex[i*2 .. i*2+1]))
  
  var pt = newSeq[byte](ct.len)
  ctx.decrypt(ct, pt)
  ctx.clear()
  
  result = ""
  for b in pt: result &= char(b)

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
