import unittest
import std/[os, options, strutils, streams, endians]
import zippy
import nimcrypto
import ../src/tui/msg
import ../src/core/extract

suite "Extraction Worker Tests":
  setup:
    open(logChannel)
  
  teardown:
    close(logChannel)

  test "Worker reports error when schema is public":
    let conf = ExtractorConfig(dbType: dbPostgres, schema: "public", encryptionKey: "12345678901234567890123456789012", outputPath: "out.enc")
    startExtraction(conf)
    var gotError = false
    while true:
      var msgOpt = logChannel.tryRecv()
      if msgOpt.dataAvailable:
        let msg = msgOpt.msg
        if msg.kind == mkError and "public" in msg.text:
          gotError = true
          break
      else:
        sleep(10)
    
    joinExtraction()
    check gotError

  test "Worker processes mock pg_dump output, compresses and encrypts":
    # 1. Create a mock pg_dump binary
    let mockDir = getTempDir() / "mock_bin"
    createDir(mockDir)
    let mockFile = mockDir / "mock_pg_dump.nim"
    let mockBin = mockDir / "pg_dump"
    writeFile(mockFile, "echo \"INSERT INTO mock_table VALUES (1, 'secret_data');\"")
    let ret = execShellCmd("nim c -o:" & mockBin & " " & mockFile)
    check ret == 0

    # 2. Add mockDir to PATH
    let oldPath = getEnv("PATH")
    putEnv("PATH", mockDir & ":" & oldPath)
    defer: putEnv("PATH", oldPath)

    # 3. Start extraction
    let outPath = mockDir / "out.enc"
    let key = "12345678901234567890123456789012"
    let conf = ExtractorConfig(
      dbType: dbPostgres,
      host: "localhost", port: 5432, user: "user", password: "pwd",
      database: "mydb", schema: "Cambalhota",
      encryptionKey: key, outputPath: outPath
    )
    
    startExtraction(conf)
    
    var gotSuccess = false
    while true:
      var msgOpt = logChannel.tryRecv()
      if msgOpt.dataAvailable:
        let msg = msgOpt.msg
        if msg.kind == mkSuccess:
          gotSuccess = true
          break
        elif msg.kind == mkError:
          echo "ERROR MSG: ", msg.text
          break
      else:
        sleep(10)

    joinExtraction()
    check gotSuccess
    check fileExists(outPath)

    # 4. Verify file is NOT readable SQL
    let rawContent = readFile(outPath)
    check "INSERT INTO" notin rawContent
    check "secret_data" notin rawContent

    # 5. Decrypt and decompress to verify data
    var ctx = initCTR(key)
    var inStream = newFileStream(outPath, fmRead)
    var decryptedStr = ""
    while not inStream.atEnd():
      var lenBytes = newString(4)
      if inStream.readData(lenBytes[0].addr, 4) == 4:
        var decLenBytes = newString(4)
        ctx.decrypt(cast[ptr byte](lenBytes[0].addr), cast[ptr byte](decLenBytes[0].addr), 4)
        var compLenLE: int32
        copyMem(compLenLE.addr, decLenBytes[0].addr, 4)
        var compLen: int32
        littleEndian32(compLen.addr, compLenLE.addr)
        
        var encChunk = newString(compLen)
        if inStream.readData(encChunk[0].addr, compLen) == compLen:
          var decChunk = newString(compLen)
          ctx.decrypt(cast[ptr byte](encChunk[0].addr), cast[ptr byte](decChunk[0].addr), uint(compLen))
          
          let decompressed = uncompress(decChunk)
          decryptedStr &= decompressed
        else:
          break
      else:
        break
    inStream.close()
    ctx.clear()

    check "INSERT INTO mock_table VALUES (1, 'secret_data');" in decryptedStr

    # Cleanup
    removeDir(mockDir)
