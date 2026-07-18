import strutils, os, algorithm, osproc, times, strformat, strtabs, streams
import nimcrypto/sha2
import ../tui/msg

type
  MigrationType* = enum
    Up, Down

  Migration* = object
    version*: string
    description*: string
    filePath*: string
    checksum*: string
    mtype*: MigrationType

proc computeChecksum*(content: string): string =
  $sha256.digest(content)

proc parseMigrationFilename*(filePath: string): Migration =
  let basename = extractFilename(filePath)
  let parts = basename.split("__")
  if parts.len >= 2:
    let vPart = parts[0]
    if vPart.startsWith("V"):
      result.version = vPart[1..^1]
    else:
      result.version = vPart
    
    let rem = parts[1].split(".")
    if rem.len >= 3:
      result.description = rem[0].replace("_", " ")
      let typeStr = rem[rem.len - 2]
      if typeStr == "up":
        result.mtype = Up
      elif typeStr == "down":
        result.mtype = Down
      else:
        result.mtype = Up
    else:
      result.description = parts[1]
      result.mtype = Up
  else:
    result.version = "0"
    result.description = basename
    result.mtype = Up
    
  result.filePath = filePath
  if fileExists(filePath):
    result.checksum = computeChecksum(readFile(filePath))
  else:
    # For testing without real files
    result.checksum = computeChecksum(basename)

proc scanMigrations*(dir: string): seq[Migration] =
  var migrations: seq[Migration] = @[]
  if dirExists(dir):
    for path in walkDirRec(dir):
      if path.endsWith(".sql"):
        migrations.add(parseMigrationFilename(path))
        
  migrations.sort(proc (x, y: Migration): int =
    cmp(x.version, y.version)
  )
  result = migrations

type MigrationError* = object of CatchableError

proc execCmdWithEnvLogged*(cmd: string, dbPass: string): (string, int) =
  var env = newStringTable(modeCaseInsensitive)
  for key, val in envPairs(): env[key] = val
  if dbPass.len > 0:
    env["PGPASSWORD"] = dbPass
    env["MYSQL_PWD"] = dbPass
  let p = startProcess(cmd, env = env, options = {poUsePath, poEvalCommand, poStdErrToStdOut})
  let outStream = p.outputStream
  var outp = ""
  try:
    var line = ""
    while outStream.readLine(line):
      outp &= line & "\n"
      logChannel.send(Msg(kind: mkLog, text: line))
  except EOFError:
    discard
  except CatchableError:
    discard
  let exitCode = p.waitForExit()
  p.close()
  return (outp, exitCode)

proc executeMigrationScript*(dbHost, dbPort, dbUser, dbPass, dbName: string, m: Migration): (bool, string, int) =
  let startT = cpuTime()
  let content = if fileExists(m.filePath): readFile(m.filePath) else: ""
  let wrappedContent = "BEGIN;\n" & content & "\nCOMMIT;\n"
  
  let tmpFile = getTempDir() / "cambalhota_migrate_" & m.version & ".sql"
  writeFile(tmpFile, wrappedContent)
  
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -f {tmpFile}"
  let (outp, exitCode) = execCmdWithEnvLogged(cmd, dbPass)
  removeFile(tmpFile)
  
  let endT = cpuTime()
  let execTimeMs = int((endT - startT) * 1000)
  
  if exitCode == 0:
    return (true, outp, execTimeMs)
  else:
    return (false, outp, execTimeMs)

proc initSchemaHistory*(dbHost, dbPort, dbUser, dbPass, dbName: string): bool =
  let ddl = """
  CREATE SCHEMA IF NOT EXISTS Cambalhota;
  CREATE TABLE IF NOT EXISTS Cambalhota.cambalhota_schema_history (
      installed_rank SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL,
      script VARCHAR(1000) NOT NULL,
      checksum VARCHAR(256),
      installed_by VARCHAR(100) NOT NULL,
      installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INT NOT NULL,
      success BOOLEAN NOT NULL
  );
  """
  let tmpFile = getTempDir() / "cambalhota_init.sql"
  writeFile(tmpFile, ddl)
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -f {tmpFile}"
  let (outp, exitCode) = execCmdWithEnvLogged(cmd, dbPass)
  removeFile(tmpFile)
  return exitCode == 0

proc getInstalledMigrations*(dbHost, dbPort, dbUser, dbPass, dbName: string): seq[string] =
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -t -c ""SELECT version FROM Cambalhota.cambalhota_schema_history WHERE success = true;"""
  let (outp, exitCode) = execCmdWithEnvLogged(cmd, dbPass)
  var versions: seq[string] = @[]
  if exitCode == 0:
    for line in outp.splitLines():
      let v = line.strip()
      if v.len > 0:
        versions.add(v)
  return versions

proc getInstalledChecksum*(dbHost, dbPort, dbUser, dbPass, dbName, version: string): string =
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -t -c ""SELECT checksum FROM Cambalhota.cambalhota_schema_history WHERE version = '{version}' AND success = true;"""
  let (outp, exitCode) = execCmdWithEnvLogged(cmd, dbPass)
  if exitCode == 0:
    return outp.strip()
  return ""

proc recordMigration*(dbHost, dbPort, dbUser, dbPass, dbName: string, m: Migration, success: bool, execTimeMs: int): bool =
  let successStr = if success: "true" else: "false"
  let scriptName = extractFilename(m.filePath)
  let stmt = fmt"""
  INSERT INTO Cambalhota.cambalhota_schema_history
    (version, description, type, script, checksum, installed_by, execution_time_ms, success)
  VALUES
    ('{m.version}', '{m.description}', '{m.mtype}', '{scriptName}', '{m.checksum}', 'Tatuí', {execTimeMs}, {successStr});
  """
  let tmpFile = getTempDir() / "cambalhota_audit.sql"
  writeFile(tmpFile, stmt)
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -f {tmpFile}"
  let (outp, exitCode) = execCmdWithEnvLogged(cmd, dbPass)
  removeFile(tmpFile)
  return exitCode == 0

proc applyMigration*(dbHost, dbPort, dbUser, dbPass, dbName: string, m: Migration): bool =
  let installedChecksum = getInstalledChecksum(dbHost, dbPort, dbUser, dbPass, dbName, m.version)
  
  if installedChecksum.len > 0:
    if installedChecksum != m.checksum:
      raise newException(MigrationError, "Checksum Validation Failed! Migration " & m.version & " was modified after installation. Expected: " & installedChecksum & ", Got: " & m.checksum)
    else:
      return true # Already installed and valid
      
  let (success, outp, execTimeMs) = executeMigrationScript(dbHost, dbPort, dbUser, dbPass, dbName, m)
  discard recordMigration(dbHost, dbPort, dbUser, dbPass, dbName, m, success, execTimeMs)
  
  if not success:
    raise newException(MigrationError, "Migration failed: " & outp)
    
  return success

type MigrationArgs* = object
  dbHost*, dbPort*, dbUser*, dbPass*, dbName*: string
  migrationFile*: string

proc workerMigrationProc(args: MigrationArgs) {.thread.} =
  try:
    logChannel.send(Msg(kind: mkLog, text: "Initializing schema history if needed..."))
    discard initSchemaHistory(args.dbHost, args.dbPort, args.dbUser, args.dbPass, args.dbName)
    let mFull = parseMigrationFilename(args.migrationFile)
    logChannel.send(Msg(kind: mkLog, text: "Applying migration " & mFull.version & " ..."))
    if applyMigration(args.dbHost, args.dbPort, args.dbUser, args.dbPass, args.dbName, mFull):
      logChannel.send(Msg(kind: mkSuccess))
    else:
      logChannel.send(Msg(kind: mkError, text: "Migration failed for unknown reason."))
  except CatchableError as e:
    logChannel.send(Msg(kind: mkError, text: "Migration Exception: " & e.msg))

var migrationThread: Thread[MigrationArgs]

proc startMigration*(args: MigrationArgs) =
  createThread(migrationThread, workerMigrationProc, args)

proc joinMigration*() =
  joinThread(migrationThread)


