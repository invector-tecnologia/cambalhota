import unittest
import std/[os, options, strutils, streams, endians]
import zippy
import nimcrypto
import ../src/tui/msg
import ../src/core/restore
import ../src/core/extract


# The log channel is opened once per test binary. Closing and reopening the same
# system Channel leaves a dangling buffer pointer in Nim's channels_builtin
# (close frees `data` without resetting it; open does not reset it either), and the
# next send frees it again: heap corruption. Each test drains it instead.
open(logChannel)

proc drainLogChannel() =
  while logChannel.tryRecv().dataAvailable: discard

suite "Restore Worker Tests":
  setup:
    drainLogChannel()
  

  test "Worker reports error when schema is public":
    let conf = RestoreConfig(dbType: dbPostgres, schema: "public", encryptionKey: "12345678901234567890123456789012", inputPath: "in.enc")
    startRestore(conf)
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
    
    joinRestore()
    check gotError

  test "Worker decrypts, decompresses and pipes to psql mock":
    let mockDir = getTempDir() / "mock_bin_restore"
    createDir(mockDir)
    let mockFile = mockDir / "mock_psql.nim"
    let mockBin = mockDir / "psql"
    # Mock psql that reads stdin and writes it to a file for verification
    let psqlMockCode = """
import streams, os
let stdinStream = newFileStream(stdin)
let outFile = open(getAppDir() / "psql_input.txt", fmWrite)
while not stdinStream.atEnd():
  outFile.write(stdinStream.readStr(1024))
outFile.close()
    """
    writeFile(mockFile, psqlMockCode)
    let ret = execShellCmd("nim c -o:" & mockBin & " " & mockFile)
    check ret == 0

    # 1. Create a mock enc file
    let encFile = mockDir / "test.enc"
    let key = "12345678901234567890123456789012"
    var ctx = initCTR(key)
    
    let plainText = "INSERT INTO mock_table VALUES (1, 'restored_data');"
    let compressed = compress(plainText, BestSpeed, dfZlib)
    
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
    
    let f = open(encFile, fmWrite)
    f.write(encryptedLen)
    f.write(encryptedChunk)
    f.close()
    ctx.clear()

    # 2. Add mockDir to PATH
    let oldPath = getEnv("PATH")
    putEnv("PATH", mockDir & ":" & oldPath)
    defer: putEnv("PATH", oldPath)

    # 3. Start restore
    let conf = RestoreConfig(
      dbType: dbPostgres,
      host: "localhost", port: 5432, user: "user", password: "pwd",
      database: "mydb", schema: "Cambalhota",
      encryptionKey: key, inputPath: encFile
    )
    
    startRestore(conf)
    
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

    joinRestore()
    check gotSuccess
    
    # 4. Verify the mock psql received the correct plain text
    let psqlInputFile = mockDir / "psql_input.txt"
    check fileExists(psqlInputFile)
    let psqlOutput = readFile(psqlInputFile)
    check "INSERT INTO mock_table VALUES (1, 'restored_data');" in psqlOutput

    # Cleanup
    removeDir(mockDir)
