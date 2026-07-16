import osproc, strformat, times, os, strutils

proc extractSchema*(dbHost, dbPort, dbUser, dbName, schemaName, outputFolder: string): string =
  ## Extrai o schema usando pg_dump e o salva na pasta de output (CDN/Git).
  let dateStr = now().format("yyyy-MM-dd'_'HH'h'mm")
  let fileName = fmt"{dateStr}_{schemaName}_dump-db.sql"
  
  # A pasta com o nome do schema deve existir
  let schemaFolder = outputFolder / schemaName
  createDir(schemaFolder)
  
  let fullPath = schemaFolder / fileName
  
  # pg_dump focado apenas no schema específico e nos dados
  let cmd = fmt"pg_dump -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -n {schemaName} -F p -f {fullPath}"
  let (outp, exitCode) = execCmdEx(cmd)
  
  if exitCode == 0:
    return fullPath
  else:
    raise newException(Exception, "Erro ao extrair schema: " & outp)

proc restoreSchema*(dbHost, dbPort, dbUser, dbName, filePath: string): bool =
  ## Restaura o schema e dados de volta para o banco de dados.
  if not fileExists(filePath):
    raise newException(Exception, "Arquivo de backup não encontrado na CDN em " & filePath)
    
  # Usa o psql para aplicar o dump plain text de volta ao DB
  let cmd = fmt"psql -h {dbHost} -p {dbPort} -U {dbUser} -d {dbName} -f {filePath}"
  let (outp, exitCode) = execCmdEx(cmd)
  
  if exitCode == 0:
    return true
  else:
    raise newException(Exception, "Erro ao restaurar schema: " & outp)

proc listBackups*(outputFolder: string): seq[string] =
  ## Lista todos os arquivos de backup disponíveis na pasta da CDN.
  var backups: seq[string] = @[]
  if dirExists(outputFolder):
    for path in walkDirRec(outputFolder):
      if path.endsWith(".sql"):
        backups.add(path)
  return backups

