import std/[parseopt, strutils]
import core/checks
import core/extract
import tui/app

when isMainModule:
  var host = "localhost"
  var port = 5432
  var user = "postgres"
  var password = ""
  var db = "postgres"
  var schema = "Cambalhota"
  var dbType = dbPostgres
  var encKey = ""  # No default (ADR 013): pass --key.
  var outPath = "backup_output.bin.enc"

  var p = initOptParser()
  for kind, key, val in p.getopt():
    case kind
    of cmdLongOption, cmdShortOption:
      case key
      of "t", "type":
        case val
        of "postgres": dbType = dbPostgres
        of "mysql": dbType = dbMysql
        of "mongo": dbType = dbMongo
        else: quit("Unknown DB type", 1)
      of "s", "schema": schema = val
      of "h", "host": host = val
      of "port": port = parseInt(val)
      of "u", "user": user = val
      of "d", "dbname": db = val
      of "p", "password": password = val
      of "k", "key": encKey = val
      of "o", "out": outPath = val
    else: discard

  let conf = ExtractorConfig(
    dbType: dbType,
    host: host,
    port: port,
    user: user,
    password: password,
    database: db,
    schema: schema,
    encryptionKey: encKey,
    outputPath: outPath
  )

  if not checkExtractor(dbType):
    quit("Error: extractor tool not found on the system.", 1)
  
  runTui(conf)
