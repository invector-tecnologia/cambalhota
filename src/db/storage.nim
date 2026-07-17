import std/[os, strutils, options, times]
import db_connector/db_sqlite
import nimcrypto

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
