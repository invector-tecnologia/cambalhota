import std/os
import extract

proc checkExtractor*(dbType: DbType): bool =
  let exe = case dbType
  of dbPostgres: "pg_dump"
  of dbMysql: "mysqldump"
  of dbMongo: "mongodump"
  
  let path = findExe(exe)
  return path.len > 0

proc checkPgDump*(): bool {.deprecated.} =
  return checkExtractor(dbPostgres)
