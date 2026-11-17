import std/[osproc, streams, strutils, os, endians, times, strtabs]
import zippy
import nimcrypto
import ../tui/msg

type
  DbType* = enum
    dbPostgres
    dbMysql
    dbMongo

  ExtractorConfig* = object
    dbType*: DbType
    host*: string
    port*: int
    user*: string
    password*: string
    database*: string
    schema*: string
    encryptionKey*: string
    outputPath*: string

proc getCommand*(conf: ExtractorConfig): string =
  case conf.dbType
  of dbPostgres:
    if conf.schema == "public" or conf.schema.strip().len == 0:
      raise newException(ValueError, "Use of the public schema is forbidden")
    return "pg_dump -h " & conf.host & " -p " & $conf.port & " -U " & conf.user & " -n " & conf.schema & " " & conf.database
  of dbMysql:
    return "mysqldump -h " & conf.host & " -P " & $conf.port & " -u " & conf.user & " " & conf.database
  of dbMongo:
    return "mongodump --host=" & conf.host & " --port=" & $conf.port & " --username=" & conf.user & " --db=" & conf.database

proc initCTR*(key: string): CTR[aes256] =
  var paddedKey = key
  if paddedKey.len < 32:
    for i in paddedKey.len ..< 32: paddedKey.add('\0')
  elif paddedKey.len > 32:
    paddedKey = paddedKey[0 ..< 32]
  
  var iv: array[16, byte]
  for i in 0..<16: iv[i] = 0
  
  var keyArr: array[32, byte]
  for i in 0..<32: keyArr[i] = paddedKey[i].byte
  
  result.init(keyArr, iv)

proc stderrWorker(pStream: Stream) {.thread.} =
  try:
    var line = ""
    while pStream.readLine(line):
      logChannel.send(Msg(kind: mkLog, text: line))
  except EOFError:
    discard
  except CatchableError:
    discard

proc workerProc(conf: ExtractorConfig) {.thread.} =
  try:
    let cmd = getCommand(conf)
    
    var env = newStringTable(modeCaseInsensitive)
    for key, val in envPairs(): env[key] = val
    env["PGPASSWORD"] = conf.password
    env["MYSQL_PWD"] = conf.password
    
    let p = startProcess(cmd, env = env, options = {poUsePath, poEvalCommand})
    let outStream = p.outputStream
    let errStream = p.errorStream
    
    var errThread: Thread[Stream]
    createThread(errThread, stderrWorker, errStream)
    
    # Ensure directory YYYY exists
    createDir(parentDir(conf.outputPath))
    
    let outFile = open(conf.outputPath, fmWrite)
    defer: outFile.close()
    
    var ctx = initCTR(conf.encryptionKey)
    
    var buffer = newString(64 * 1024)
    var totalProcessed: int64 = 0
    var chunksProcessed: int64 = 0
    var lastTime = cpuTime()
    
    while true:
      let bytesRead = outStream.readData(buffer[0].addr, buffer.len)
      if bytesRead == 0:
        break
        
      let chunkData = buffer[0 ..< bytesRead]
      let compressed = compress(chunkData, BestSpeed, dfZlib)
      
      var compLen = int32(compressed.len)
      var compLenLE: int32
      littleEndian32(compLenLE.addr, compLen.addr)
      var lenBytes = newString(4)
      copyMem(lenBytes[0].addr, compLenLE.addr, 4)
      
      var encryptedLen = newString(4)
      ctx.encrypt(cast[ptr byte](lenBytes[0].addr), cast[ptr byte](encryptedLen[0].addr), 4.uint)
      
      var encryptedChunk = newString(compressed.len)
      if compressed.len > 0:
        ctx.encrypt(cast[ptr byte](compressed[0].unsafeAddr), cast[ptr byte](encryptedChunk[0].addr), uint(compressed.len))
      
      outFile.write(encryptedLen)
      outFile.write(encryptedChunk)
      
      totalProcessed += bytesRead
      chunksProcessed += 1
      
      let now = cpuTime()
      if now - lastTime > 0.1:
        logChannel.send(Msg(kind: mkProgress, bytesRead: totalProcessed, totalBytes: 0))
        lastTime = now
    
    let exitCode = p.waitForExit()
    joinThread(errThread)
    p.close()
    ctx.clear()
    
    if exitCode == 0:
      logChannel.send(Msg(kind: mkSuccess))
    else:
      logChannel.send(Msg(kind: mkError, text: "Process exited with code " & $exitCode))
  except CatchableError as e:
    logChannel.send(Msg(kind: mkError, text: "Exception: " & e.msg))

var extractThread: Thread[ExtractorConfig]

proc startExtraction*(conf: ExtractorConfig) =
  createThread(extractThread, workerProc, conf)

proc joinExtraction*() =
  joinThread(extractThread)
