import unittest, os, atomics
import ../src/core/cloud

suite "Asynchronous Cloud Backup Sync (S3)":
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

  test "Asynchronous backup upload succeeds (happy path)":
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

  test "Asynchronous backup download succeeds (happy path)":
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

  test "Handles a network failure during transfer":
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
    check errMsg == "Network connection error"

  test "Rejects invalid S3 keys":
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
    check errMsg == "Authentication error: check your S3 credentials"

  test "Cancels a transfer in progress":
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
    check errMsg == "Operation canceled by the user"
