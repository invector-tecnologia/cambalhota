import std/[osproc, streams, strutils, os, endians, times, strtabs]
import zippy
import nimcrypto
import extract
import ../tui/msg

type
  RestoreConfig* = object
    dbType*: DbType
    host*: string
    port*: int
    user*: string
    password*: string
    database*: string
    schema*: string
    encryptionKey*: string
    inputPath*: string

proc getRestoreCommand*(conf: RestoreConfig): string =
  case conf.dbType
  of dbPostgres:
    if conf.schema == "public" or conf.schema.strip().len == 0:
      raise newException(ValueError, "Use of the public schema is forbidden")
    return "psql -h " & conf.host & " -p " & $conf.port & " -U " & conf.user & " -d " & conf.database
  of dbMysql:
    return "mysql -h " & conf.host & " -P " & $conf.port & " -u " & conf.user & " " & conf.database
  of dbMongo:
    return "mongorestore --host=" & conf.host & " --port=" & $conf.port & " --username=" & conf.user & " --db=" & conf.database & " --archive"

proc listLocalBackups*(year: string): seq[string] =
  result = @[]
  let baseDir = getHomeDir() / ".cambalhota" / "db_dump" / year
  if dirExists(baseDir):
    for kind, path in walkDir(baseDir):
      if kind == pcFile and path.endsWith(".enc"):
        result.add(path)

proc stderrWorkerRestore(pStream: Stream) {.thread.} =
  try:
    var line = ""
    while pStream.readLine(line):
      logChannel.send(Msg(kind: mkLog, text: line))
  except EOFError:
    discard
  except CatchableError:
    discard

proc workerRestoreProc(conf: RestoreConfig) {.thread.} =
  try:
    let cmd = getRestoreCommand(conf)
    
    var env = newStringTable(modeCaseInsensitive)
    for key, val in envPairs(): env[key] = val
    env["PGPASSWORD"] = conf.password
    env["MYSQL_PWD"] = conf.password
    
    # We use poUsePath to find psql/mysql/mongorestore in PATH, poEvalCommand just in case
    let p = startProcess(cmd, env = env, options = {poUsePath, poEvalCommand})
    let inStream = p.inputStream
    let errStream = p.errorStream
    
    var errThread: Thread[Stream]
    createThread(errThread, stderrWorkerRestore, errStream)
    
    let inFile = open(conf.inputPath, fmRead)
    defer: inFile.close()
    
    var ctx = initCTR(conf.encryptionKey)
    
    var totalProcessed: int64 = 0
    var chunksProcessed: int64 = 0
    var lastTime = cpuTime()
    
    while not inFile.endOfFile:
      # Read encrypted length (4 bytes)
      var encryptedLen = newString(4)
      let lenRead = inFile.readBuffer(encryptedLen[0].addr, 4)
      if lenRead < 4:
        break # EOF
      
      var lenBytes = newString(4)
      ctx.decrypt(cast[ptr byte](encryptedLen[0].addr), cast[ptr byte](lenBytes[0].addr), 4.uint)
      
      var compLenLE: int32
      copyMem(compLenLE.addr, lenBytes[0].addr, 4)
      var compLen: int32
      littleEndian32(compLen.addr, compLenLE.addr)
      
      if compLen <= 0 or compLen > 100 * 1024 * 1024:
        raise newException(ValueError, "Invalid block length")
        
      var encryptedChunk = newString(compLen)
      let chunkRead = inFile.readBuffer(encryptedChunk[0].addr, compLen)
      if chunkRead < compLen:
        raise newException(ValueError, "Corrupted file: incomplete block")
        
      var compressedChunk = newString(compLen)
      ctx.decrypt(cast[ptr byte](encryptedChunk[0].addr), cast[ptr byte](compressedChunk[0].addr), uint(compLen))
      
      let plainText = uncompress(compressedChunk, dfZlib)
      
      if plainText.len > 0:
        inStream.writeData(plainText[0].unsafeAddr, plainText.len)
        totalProcessed += plainText.len
        
      chunksProcessed += 1
      let now = cpuTime()
      if now - lastTime > 0.1:
        logChannel.send(Msg(kind: mkProgress, bytesRead: totalProcessed, totalBytes: 0))
        lastTime = now
    
    inStream.close() # Signal EOF to db utility
    
    let exitCode = p.waitForExit()
    joinThread(errThread)
    p.close()
    ctx.clear()
    
    if exitCode == 0:
      logChannel.send(Msg(kind: mkSuccess))
    else:
      logChannel.send(Msg(kind: mkError, text: "Restore process exited with code " & $exitCode))
  except CatchableError as e:
    logChannel.send(Msg(kind: mkError, text: "Exception: " & e.msg))

var restoreThread: Thread[RestoreConfig]

proc startRestore*(conf: RestoreConfig) =
  createThread(restoreThread, workerRestoreProc, conf)

proc joinRestore*() =
  joinThread(restoreThread)
