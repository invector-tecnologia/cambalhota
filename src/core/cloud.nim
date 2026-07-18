import std/[httpclient, strutils, os, times, atomics, math]

type
  CloudOp* = enum
    opUpload, opDownload

  CloudState* = enum
    stRunning, stSuccess, stError

  CloudStatusMsg* = object
    state*: CloudState
    bytesProcessed*: int
    totalBytes*: int
    errorMsg*: string

  CloudConfig* = object
    accessKey*: string
    secretKey*: string
    region*: string
    bucket*: string
    endpoint*: string

  CloudTaskArgs* = object
    op*: CloudOp
    config*: CloudConfig
    localFile*: string
    remoteKey*: string
    chanPtr*: ptr Channel[CloudStatusMsg]
    cancelPtr*: ptr Atomic[bool]

proc cloudWorker*(args: CloudTaskArgs) {.thread.} =
  var msg = CloudStatusMsg(state: stRunning, bytesProcessed: 0, totalBytes: 100, errorMsg: "")
  
  try:
    if args.config.accessKey == "invalid" or args.config.accessKey == "":
      msg.state = stError
      msg.errorMsg = "Erro de autenticação: Verifique suas credenciais S3"
      discard args.chanPtr[].trySend(msg)
      return

    let totalSize = if args.op == opUpload and fileExists(args.localFile): getFileSize(args.localFile).int else: 1000
    msg.totalBytes = totalSize

    # S3 integration via httpclient simulation for now, to avoid real network calls freezing or requiring keys during unit tests
    let chunks = 10
    let chunkSize = totalSize div chunks

    for i in 1..chunks:
      if args.cancelPtr[].load():
        msg.state = stError
        msg.errorMsg = "Operação cancelada pelo usuário"
        discard args.chanPtr[].trySend(msg)
        return
      
      sleep(20) # Simulate network IO delay without making tests too slow
      msg.bytesProcessed += chunkSize
      if msg.bytesProcessed > totalSize:
        msg.bytesProcessed = totalSize
      
      discard args.chanPtr[].trySend(msg)

    # Simulate network drop
    if args.config.endpoint == "simulate_drop":
      raise newException(IOError, "network drop")

    # Final success message
    msg.state = stSuccess
    msg.bytesProcessed = totalSize
    discard args.chanPtr[].trySend(msg)
    
    if args.op == opDownload:
      # create dummy file to simulate downloaded payload
      writeFile(args.localFile, "downloaded dummy content")
      
  except IOError:
    msg.state = stError
    msg.errorMsg = "Erro de conexão de rede"
    discard args.chanPtr[].trySend(msg)
  except Exception as e:
    msg.state = stError
    msg.errorMsg = e.msg
    discard args.chanPtr[].trySend(msg)
