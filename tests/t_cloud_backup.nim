import unittest, os, atomics
import ../src/core/cloud

suite "Sincronização Assíncrona de Backups na Nuvem (S3)":
  var
    testChan: Channel[CloudStatusMsg]
    testCancel: Atomic[bool]
    
  setup:
    testChan.open()
    testCancel.store(false)

  teardown:
    testChan.close()
    if fileExists("test_upload.enc"): removeFile("test_upload.enc")
    if fileExists("test_download.enc"): removeFile("test_download.enc")

  test "Upload assíncrono de backup com sucesso (Caminho Feliz)":
    writeFile("test_upload.enc", "mock data")
    let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
    let args = CloudTaskArgs(op: opUpload, config: conf, localFile: "test_upload.enc", remoteKey: "remote.enc", chanPtr: addr testChan, cancelPtr: addr testCancel)
    
    var thr: Thread[CloudTaskArgs]
    createThread(thr, cloudWorker, args)
    
    var finalState = stRunning
    while true:
      let res = testChan.tryRecv()
      if res.dataAvailable:
        if res.msg.state != stRunning:
          finalState = res.msg.state
          break
    
    joinThread(thr)
    check finalState == stSuccess

  test "Download assíncrono de backup com sucesso (Caminho Feliz)":
    let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
    let args = CloudTaskArgs(op: opDownload, config: conf, localFile: "test_download.enc", remoteKey: "remote.enc", chanPtr: addr testChan, cancelPtr: addr testCancel)
    
    var thr: Thread[CloudTaskArgs]
    createThread(thr, cloudWorker, args)
    
    var finalState = stRunning
    while true:
      let res = testChan.tryRecv()
      if res.dataAvailable:
        if res.msg.state != stRunning:
          finalState = res.msg.state
          break
    
    joinThread(thr)
    check finalState == stSuccess
    check fileExists("test_download.enc")

  test "Tratamento de falha de rede durante transferência":
    let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "simulate_drop")
    let args = CloudTaskArgs(op: opUpload, config: conf, localFile: "test_upload.enc", remoteKey: "remote.enc", chanPtr: addr testChan, cancelPtr: addr testCancel)
    
    var thr: Thread[CloudTaskArgs]
    createThread(thr, cloudWorker, args)
    
    var finalState = stRunning
    var errMsg = ""
    while true:
      let res = testChan.tryRecv()
      if res.dataAvailable:
        if res.msg.state != stRunning:
          finalState = res.msg.state
          errMsg = res.msg.errorMsg
          break
          
    joinThread(thr)
    check finalState == stError
    check errMsg == "Erro de conexão de rede"

  test "Uso de chaves S3 inválidas":
    let conf = CloudConfig(accessKey: "invalid", secretKey: "invalid", region: "us-east-1", bucket: "bck", endpoint: "")
    let args = CloudTaskArgs(op: opUpload, config: conf, localFile: "test_upload.enc", remoteKey: "remote.enc", chanPtr: addr testChan, cancelPtr: addr testCancel)
    
    var thr: Thread[CloudTaskArgs]
    createThread(thr, cloudWorker, args)
    
    var finalState = stRunning
    var errMsg = ""
    while true:
      let res = testChan.tryRecv()
      if res.dataAvailable:
        if res.msg.state != stRunning:
          finalState = res.msg.state
          errMsg = res.msg.errorMsg
          break
          
    joinThread(thr)
    check finalState == stError
    check errMsg == "Erro de autenticação: Verifique suas credenciais S3"

  test "Cancelamento de um envio em andamento":
    let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
    let args = CloudTaskArgs(op: opUpload, config: conf, localFile: "test_upload.enc", remoteKey: "remote.enc", chanPtr: addr testChan, cancelPtr: addr testCancel)
    
    var thr: Thread[CloudTaskArgs]
    createThread(thr, cloudWorker, args)
    
    sleep(10) # Let it start
    testCancel.store(true)
    
    var finalState = stRunning
    var errMsg = ""
    while true:
      let res = testChan.tryRecv()
      if res.dataAvailable:
        if res.msg.state != stRunning:
          finalState = res.msg.state
          errMsg = res.msg.errorMsg
          break
          
    joinThread(thr)
    check finalState == stError
    check errMsg == "Operação cancelada pelo usuário"
