import osproc, strformat, times, os, strutils

proc extractSchema*(dbHost, dbPort, dbUser, dbName, schemaName, outputFolder: string): string =
  ## Extracts the schema with pg_dump and saves it to the output folder (CDN/Git).
  let dateStr = now().format("yyyy-MM-dd'_'HH'h'mm")
  let fileName = fmt"{dateStr}_{schemaName}_dump-db.sql"
  
  # The folder named after the schema must exist
  let schemaFolder = outputFolder / schemaName
  createDir(schemaFolder)
  
  let fullPath = schemaFolder / fileName
  
  # pg_dump limited to the given schema and its data
  let cmd = fmt"pg_dump -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -n {schemaName} -F p -f {fullPath}"
  let (outp, exitCode) = execCmdEx(cmd)
  
  if exitCode == 0:
    return fullPath
  else:
    raise newException(Exception, "Error extracting the schema: " & outp)

proc restoreSchema*(dbHost, dbPort, dbUser, dbName, filePath: string): bool =
  ## Restores the schema and data back into the database.
  if not fileExists(filePath):
    raise newException(Exception, "Backup file not found in the CDN at " & filePath)
    
  # Uses psql to apply the plain-text dump back to the database
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -f {filePath}"
  let (outp, exitCode) = execCmdEx(cmd)
  
  if exitCode == 0:
    return true
  else:
    raise newException(Exception, "Error restoring the schema: " & outp)

proc listBackups*(outputFolder: string): seq[string] =
  ## Lists every backup file available in the CDN folder.
  var backups: seq[string] = @[]
  if dirExists(outputFolder):
    for path in walkDirRec(outputFolder):
      if path.endsWith(".sql"):
        backups.add(path)
  return backups

