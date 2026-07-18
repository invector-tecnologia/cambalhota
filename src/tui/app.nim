import std/[os, options, unicode, deques, strutils]
import std/atomics
import ../core/cloud
import tatui
import tatui/event/reader
import msg
import ../core/extract
import ../core/db
import ../db/storage

const MaxLogs = 100

type
  AppState* = enum
    stRunning, stSuccess, stError

const LogoAscii = """
  ████    █████   ███   ███  ██████    █████   ██       ██   ██   ██████   ████████   █████  
 ██  ██  ██   ██  ████ ████  ██   ██  ██   ██  ██       ██   ██  ██    ██     ██     ██   ██ 
 ██      ███████  ██ ███ ██  ██████   ███████  ██       ███████  ██    ██     ██     ███████ 
 ██  ██  ██   ██  ██  █  ██  ██   ██  ██   ██  ██       ██   ██  ██    ██     ██     ██   ██ 
  ████   ██   ██  ██     ██  ██████   ██   ██  ███████  ██   ██   ██████      ██     ██   ██ 
"""

proc getFiles(path: string): seq[string] =
  result = @[]
  if path.len > 0 and dirExists(path):
    for kind, file in walkDir(path):
      if kind == pcFile or kind == pcLinkToFile:
        if file.endsWith(".sql") or file.endsWith(".enc"):
          result.add(file)

proc runTui*(initialConf: ExtractorConfig = ExtractorConfig()) =
  # Initialize SQLite DB
  initDb()

  var term = newTerminal(newAnsiBackend())
  term.setup()
  defer: term.restore()

  var
    running = true
    selectedMenu = 0 # 0: Config, 1: Backup, 2: Restore, 3: History
    statusMsg = "STATUS: Ready. [L/R] Tabs | [Up/Dn] Nav | [Enter] Sel | [A] Add | [E] Edit | [C] Copy | [D] Del | [Q] Quit"
    inFocus = 0      # 0: left, 1: right (for cross-restore)
    listStConfig: ListState
    listStBackup: ListState
    listStRestoreDump: ListState
    listStRestoreConn: ListState
    listStHistory: ListState
    listStCloudProvider: ListState
    configFilesIdx, backupFilesIdx, restoreDumpIdx, restoreConnIdx,
      historyFilesIdx, cloudFilesIdx = 0
    isAddingConn = false
    editingConnId = -1
    formIndex = 0
    formLabels = ["Name", "Engine (pg, mysql)", "Host", "Port", "User",
        "DB Name", "Password", "Schema"]
    formValues = ["", "", "", "", "", "", "", ""]
    isAddingCloud = false
    editingCloudId = ""
    cloudFormIndex = 0
    cloudFormLabels = ["Name", "Provider (aws, minio, s3)", "Credentials (JSON)", "Metadata (JSON)"]
    cloudFormValues = ["", "", "", ""]
    isCloudModalOpen = false
    isCloudOpActive = false
    cloudDumps = @["remote_dump_prod_2026.enc", "remote_dump_staging_2026.enc", "remote_dump_dev.enc"]
    cloudDumpIdx = 0
    listStCloudDump: ListState
    cloudChan: Channel[CloudStatusMsg]
    cloudCancel: Atomic[bool]
    cloudThread: Thread[CloudTaskArgs]

  cloudChan.open()
  logChannel.open()
  cloudCancel.store(false)
  defer: cloudChan.close()
  defer: logChannel.close()

  while running:
    let connections = listConnections()
    let dumps = getFiles("dumps")
    let historyList = listRestoreHistory()
    let cloudProviders = listCloudProviders()

    if connections.len > 0:
      if configFilesIdx >= connections.len: configFilesIdx = connections.len - 1
      if backupFilesIdx >= connections.len: backupFilesIdx = connections.len - 1
      if restoreConnIdx >= connections.len: restoreConnIdx = connections.len - 1
    else:
      configFilesIdx = 0; backupFilesIdx = 0; restoreConnIdx = 0

    if dumps.len > 0:
      if restoreDumpIdx >= dumps.len: restoreDumpIdx = dumps.len - 1
    else:
      restoreDumpIdx = 0

    if historyList.len > 0:
      if historyFilesIdx >= historyList.len: historyFilesIdx = historyList.len - 1
    else:
      historyFilesIdx = 0

    if cloudProviders.len > 0:
      if cloudFilesIdx >= cloudProviders.len: cloudFilesIdx = cloudProviders.len - 1
    else:
      cloudFilesIdx = 0

    if connections.len > 0:
      listStConfig.select(configFilesIdx)
      listStBackup.select(backupFilesIdx)
      listStRestoreConn.select(restoreConnIdx)
    else:
      listStConfig.selected = none(int)
      listStBackup.selected = none(int)
      listStRestoreConn.selected = none(int)

    if dumps.len > 0:
      listStRestoreDump.select(restoreDumpIdx)
    else:
      listStRestoreDump.selected = none(int)

    if historyList.len > 0:
      listStHistory.select(historyFilesIdx)
    else:
      listStHistory.selected = none(int)

    if cloudProviders.len > 0:
      listStCloudProvider.select(cloudFilesIdx)
    else:
      listStCloudProvider.selected = none(int)

    if cloudDumps.len > 0:
      listStCloudDump.select(cloudDumpIdx)

    let logRes = logChannel.tryRecv()
    if logRes.dataAvailable:
      let lmsg = logRes.msg
      if lmsg.kind == mkLog:
        statusMsg = "STATUS: " & lmsg.text
      elif lmsg.kind == mkProgress:
        statusMsg = "STATUS: Processed " & $(lmsg.bytesRead div 1024) & " KB"
      elif lmsg.kind == mkSuccess:
        statusMsg = "STATUS: Operation successful"
      elif lmsg.kind == mkError:
        statusMsg = "STATUS: Error: " & lmsg.text

    if isCloudOpActive:
      let res = cloudChan.tryRecv()
      if res.dataAvailable:
        let msg = res.msg
        if msg.state == stRunning:
          let pct = if msg.totalBytes > 0: (msg.bytesProcessed * 100) div msg.totalBytes else: 0
          let bars = if pct > 0: pct div 10 else: 0
          statusMsg = "STATUS: [Cyan] Transferring [" & repeat("█", bars) & repeat("░", 10 - bars) & "] " & $(pct) & "%"
        elif msg.state == stSuccess:
          isCloudOpActive = false
          joinThread(cloudThread)
          statusMsg = "STATUS: [Green] Operação concluída com sucesso"
        elif msg.state == stError:
          isCloudOpActive = false
          joinThread(cloudThread)
          statusMsg = "STATUS: [Red] " & msg.errorMsg

    try: term.draw proc(f: var Frame) =
      let mainChunks = f.area.split(Vertical, @[length(7), length(1), fill(1),
          length(3)])
      let logoRect = mainChunks[0]
      let headerRect = mainChunks[1]
      let bodyRect = mainChunks[2]
      let statusRect = mainChunks[3]

      f.renderWidget(paragraph(text(LogoAscii), style = defaultStyle().fg(
          Magenta)), logoRect)

      let menuItems = @[" 1. Config ", " 2. Backup ", " 3. Restore ", " 4. Cloud ", " 5. History "]
      var t = tabs(menuItems, selected = selectedMenu,
          highlightStyle = defaultStyle().bg(Magenta).fg(Black))
      t.style = defaultStyle().fg(Cyan)
      f.renderWidget(t, headerRect)

      let bodyChunks = bodyRect.split(Horizontal, @[fill(1), length(35)])
      let contentRect = bodyChunks[0]
      let helpRect = bodyChunks[1]

      var helpText = ""
      if isAddingConn:
        helpText = "\n[Up/Down]: Move between fields\n[Backspace]: Delete char\n[Esc/Ctrl+C]: Cancel\n[Enter]: Save on the last field\n\n- Engine: 'pg', 'mysql', etc\n- Port: pg=5432, mysql=3306"
      elif isAddingCloud:
        helpText = "\n[Up/Down]: Move fields\n[Backspace]: Del char\n[Esc/Ctrl+C]: Cancel\n[Enter]: Save on last field\n\nJSON strictly."
      elif selectedMenu == 0:
        helpText = "\n[A]: Add new connection\n[E]: Edit connection\n[C]: Clone connection\n[D]: Delete connection\n[Up/Down]: Scroll list\n[L/R]: Change tabs"
      elif selectedMenu == 1:
        helpText = "\n[Up/Down]: Scroll list\n[Enter]: Trigger backup\n[Shift+Enter]: Backup & Upload\n\nBackups are saved locally."
      elif selectedMenu == 2:
        helpText = "\n[L/R]: Switch panel focus\n[Up/Down]: Scroll items\n[Enter]: Trigger restore\n[D]: Download from Cloud\n[U]: Upload to Cloud"
      elif selectedMenu == 3:
        helpText = "\n[A]: Add Cloud\n[E]: Edit Cloud\n[C]: Clone Cloud\n[D]: Delete Cloud\n[Up/Down]: Scroll list\n[L/R]: Change tabs"
      elif selectedMenu == 4:
        helpText = "\n[Up/Down]: Scroll history\n\nAudit log of restores."

      f.renderWidget(paragraph(text(helpText), blk = some(initBlock(
          title = " QUICK GUIDE ", borders = AllBorders,
          borderStyle = defaultStyle().fg(Magenta))), style = defaultStyle().fg(
          Yellow)), helpRect)

      if isAddingConn:
        var formLines = if editingConnId ==
            -1: "=== ADD NEW CONNECTION (Ctrl+C to Cancel) ===\n\n" else: "=== EDIT CONNECTION (Ctrl+C to Cancel) ===\n\n"
        for i, label in formLabels:
          let pointer = if i == formIndex: " > " else: "   "
          let cursor = if i == formIndex: "█" else: ""
          formLines.add(pointer & label & ": " & formValues[i] & cursor & "\n")
        f.renderWidget(paragraph(text(formLines), blk = some(initBlock(
            title = if editingConnId ==
            -1: " NEW CONNECTION " else: " EDIT CONNECTION ",
            borders = AllBorders, borderStyle = defaultStyle().fg(Green)))), contentRect)
      elif isAddingCloud:
        var formLines = if editingCloudId == "": "=== ADD NEW CLOUD (Ctrl+C to Cancel) ===\n\n" else: "=== EDIT CLOUD (Ctrl+C to Cancel) ===\n\n"
        for i, label in cloudFormLabels:
          let pointer = if i == cloudFormIndex: " > " else: "   "
          let cursor = if i == cloudFormIndex: "█" else: ""
          formLines.add(pointer & label & ": " & cloudFormValues[i] & cursor & "\n")
        f.renderWidget(paragraph(text(formLines), blk = some(initBlock(
            title = if editingCloudId == "": " NEW CLOUD " else: " EDIT CLOUD ",
            borders = AllBorders, borderStyle = defaultStyle().fg(Green)))), contentRect)
      elif selectedMenu == 0:
        var items: seq[ListItem]
        for c in connections:
          items.add listItem("[" & c.engine.toUpperAscii() & "] DB: " &
              c.dbname & " | SCHEMA: " & c.schema & " (" & c.name & ")",
              style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(
              title = " CONNECTIONS [Press A to Add, D to Delete] ",
              borders = AllBorders, borderStyle = defaultStyle().fg(Blue)))),
          contentRect, listStConfig
        )
      elif selectedMenu == 1:
        var items: seq[ListItem]
        for c in connections:
          items.add listItem("[" & c.engine.toUpperAscii() & "] DB: " &
              c.dbname & " | SCHEMA: " & c.schema & " (" & c.name & ")",
              style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(
              title = " SELECT CONNECTION TO BACKUP [Press Enter] ",
              borders = AllBorders, borderStyle = defaultStyle().fg(Green)))),
          contentRect, listStBackup
        )
      elif selectedMenu == 2:
        let hChunks = contentRect.split(Horizontal, @[pct(50), pct(50)])
        var dumpItems: seq[ListItem]
        for d in dumps: dumpItems.add listItem("[LOCAL] " & d.extractFilename(),
            style = defaultStyle().fg(White))
        let leftBColor = if inFocus == 0: Yellow else: Blue
        f.renderStateful(
          list(dumpItems, blk = some(initBlock(title = " 1. SOURCE DUMP ",
              borders = AllBorders, borderStyle = defaultStyle().fg(
              leftBColor)))),
          hChunks[0], listStRestoreDump
        )
        var connItems: seq[ListItem]
        for c in connections: connItems.add listItem("[" &
            c.engine.toUpperAscii() & "] DB: " & c.dbname & " | SCHEMA: " &
            c.schema, style = defaultStyle().fg(White))
        let rightBColor = if inFocus == 1: Yellow else: Blue
        f.renderStateful(
          list(connItems, blk = some(initBlock(title = " 2. TARGET CONNECTION ",
              borders = AllBorders, borderStyle = defaultStyle().fg(
              rightBColor)))),
          hChunks[1], listStRestoreConn
        )
      elif selectedMenu == 3:
        var items: seq[ListItem]
        for c in cloudProviders:
          items.add listItem("[" & c.provider_type.toUpperAscii() & "] " & c.name, style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(title = " CLOUD PROVIDERS [Press A to Add, D to Delete] ", borders = AllBorders, borderStyle = defaultStyle().fg(Blue)))),
          contentRect, listStCloudProvider
        )
      elif selectedMenu == 4:
        var items: seq[ListItem]
        for h in historyList:
          items.add listItem(h.restored_at & " -> " & h.dump_file &
              " restored to [" & h.connection_name & "] DB: " & h.dbname &
              " SCHEMA: " & h.schema, style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(title = " RESTORE HISTORY ",
              borders = AllBorders, borderStyle = defaultStyle().fg(Magenta)))),
          contentRect, listStHistory
        )

      if isCloudModalOpen:
        let popupArea = f.area.split(Vertical, @[fill(1), length(10), fill(1)])[1].split(Horizontal, @[fill(1), length(50), fill(1)])[1]
        var items: seq[ListItem]
        for cd in cloudDumps:
          items.add listItem("[CLOUD] " & cd, style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(title = " REMOTE DUMPS [Enter to Download, Esc to Cancel] ", borders = AllBorders, borderStyle = defaultStyle().fg(Cyan)))),
          popupArea, listStCloudDump
        )

      f.renderWidget(paragraph(text(statusMsg), blk = some(initBlock(
          borders = AllBorders, borderStyle = defaultStyle().fg(Cyan))),
          style = defaultStyle().fg(Yellow)), statusRect)
    except IOError:
      discard # Terminal resize (SIGWINCH) interrupted sys write
    except Exception as e:
      statusMsg = "Render Error: " & e.msg

    let evOpt = pollEvent(50)
    if evOpt.isSome and evOpt.get.kind == evKey:
      let k = evOpt.get.key

      if isCloudModalOpen:
        if k.code == kcEsc or (k.code == kcChar and (k.rune == Rune(27) or k.rune == Rune(3))):
          isCloudModalOpen = false
        elif k.code == kcUp and cloudDumpIdx > 0: cloudDumpIdx.dec
        elif k.code == kcDown and cloudDumpIdx < cloudDumps.len - 1: cloudDumpIdx.inc
        elif k.code == kcEnter:
          isCloudModalOpen = false
          if not isCloudOpActive:
            let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
            let args = CloudTaskArgs(op: opDownload, config: conf, localFile: "dumps/" & cloudDumps[cloudDumpIdx], remoteKey: cloudDumps[cloudDumpIdx], chanPtr: addr cloudChan, cancelPtr: addr cloudCancel)
            cloudCancel.store(false)
            createThread(cloudThread, cloudWorker, args)
            isCloudOpActive = true
            statusMsg = "STATUS: Starting download..."
        continue

      if isAddingConn:
        if k.code == kcEsc or (k.code == kcChar and (k.rune == Rune(27) or
            k.rune == Rune(3) or (k.rune == Rune('c'.ord) and kmCtrl in k.mods))):
          isAddingConn = false
          editingConnId = -1
          formValues = ["", "", "", "", "", "", "", ""]
          formIndex = 0
        elif k.code == kcUp and formIndex > 0: formIndex.dec
        elif k.code == kcDown and formIndex < formLabels.len - 1: formIndex.inc
        elif k.code == kcBackspace:
          if formValues[formIndex].len > 0: formValues[formIndex] = formValues[
              formIndex][0 .. ^2]
        elif k.code == kcEnter:
          if formIndex < formLabels.len - 1:
            formIndex.inc
          else:
            try:
              var cSchema = formValues[7]
              if cSchema == "": cSchema = "Cambalhota"
              let cPort = parseInt(formValues[3])
              let newRec = ConnectionRecord(name: formValues[0],
                  engine: formValues[1], host: formValues[2], port: cPort,
                  user: formValues[4], dbname: formValues[5],
                  encrypted_password: formValues[6], schema: cSchema)
              if editingConnId == -1:
                saveConnection(newRec)
                statusMsg = "STATUS: Connection saved."
              else:
                updateConnection(editingConnId, newRec)
                statusMsg = "STATUS: Connection updated."
            except Exception as e:
              statusMsg = "STATUS: Failed to save: " & e.msg
            isAddingConn = false
            editingConnId = -1
            formValues = ["", "", "", "", "", "", "", ""]
            formIndex = 0
        elif k.code == kcChar:
          if formValues[formIndex].len < 256:
            let cInt = int(k.rune)
            if cInt >= 32 and cInt != 127:
              formValues[formIndex].add($k.rune)
        continue

      if isAddingCloud:
        if k.code == kcEsc or (k.code == kcChar and (k.rune == Rune(27) or
            k.rune == Rune(3) or (k.rune == Rune('c'.ord) and kmCtrl in k.mods))):
          isAddingCloud = false
          editingCloudId = ""
          cloudFormValues = ["", "", "", ""]
          cloudFormIndex = 0
        elif k.code == kcUp and cloudFormIndex > 0: cloudFormIndex.dec
        elif k.code == kcDown and cloudFormIndex < cloudFormLabels.len - 1: cloudFormIndex.inc
        elif k.code == kcBackspace:
          if cloudFormValues[cloudFormIndex].len > 0: cloudFormValues[cloudFormIndex] = cloudFormValues[cloudFormIndex][0 .. ^2]
        elif k.code == kcEnter:
          if cloudFormIndex < cloudFormLabels.len - 1:
            cloudFormIndex.inc
          else:
            try:
              var newRec = CloudProviderRecord(
                id: editingCloudId,
                name: cloudFormValues[0],
                provider_type: cloudFormValues[1],
                encrypted_credentials: cloudFormValues[2],
                metadata: cloudFormValues[3]
              )
              if editingCloudId == "":
                saveCloudProvider(newRec)
                statusMsg = "STATUS: Cloud Provider saved."
              else:
                updateCloudProvider(editingCloudId, newRec)
                statusMsg = "STATUS: Cloud Provider updated."
            except Exception as e:
              statusMsg = "STATUS: Failed to save: " & e.msg
            isAddingCloud = false
            editingCloudId = ""
            cloudFormValues = ["", "", "", ""]
            cloudFormIndex = 0
        elif k.code == kcChar:
          if cloudFormValues[cloudFormIndex].len < 1024:
            let cInt = int(k.rune)
            if cInt >= 32 and cInt != 127:
              cloudFormValues[cloudFormIndex].add($k.rune)
        continue

      if k.code == kcChar and (k.rune == Rune('c'.ord) or k.rune == Rune('C'.ord)) and isCloudOpActive:
        cloudCancel.store(true)
        continue
      if k.code == kcChar and (k.rune == Rune('q'.ord) or k.rune == Rune('Q'.ord)):
        running = false
      elif k.code == kcLeft:
        if selectedMenu == 2 and inFocus == 1: inFocus = 0
        elif selectedMenu > 0: selectedMenu.dec; statusMsg = "STATUS: Ready."
      elif k.code == kcRight:
        if selectedMenu == 2 and inFocus == 0: inFocus = 1
        elif selectedMenu < 4: selectedMenu.inc; statusMsg = "STATUS: Ready."
      elif k.code == kcUp:
        if selectedMenu == 0 and configFilesIdx > 0: configFilesIdx.dec
        elif selectedMenu == 1 and backupFilesIdx > 0: backupFilesIdx.dec
        elif selectedMenu == 2:
          if inFocus == 0 and restoreDumpIdx > 0: restoreDumpIdx.dec
          elif inFocus == 1 and restoreConnIdx > 0: restoreConnIdx.dec
        elif selectedMenu == 3 and cloudFilesIdx > 0: cloudFilesIdx.dec
        elif selectedMenu == 4 and historyFilesIdx > 0: historyFilesIdx.dec
      elif k.code == kcDown:
        if selectedMenu == 0 and connections.len > 0 and configFilesIdx <
            connections.len - 1: configFilesIdx.inc
        elif selectedMenu == 1 and connections.len > 0 and backupFilesIdx <
            connections.len - 1: backupFilesIdx.inc
        elif selectedMenu == 2:
          if inFocus == 0 and dumps.len > 0 and restoreDumpIdx < dumps.len -
              1: restoreDumpIdx.inc
          elif inFocus == 1 and connections.len > 0 and restoreConnIdx <
              connections.len - 1: restoreConnIdx.inc
        elif selectedMenu == 3 and cloudProviders.len > 0 and cloudFilesIdx <
            cloudProviders.len - 1: cloudFilesIdx.inc
        elif selectedMenu == 4 and historyList.len > 0 and historyFilesIdx <
            historyList.len - 1: historyFilesIdx.inc
      elif k.code == kcChar and (k.rune == Rune('a'.ord) or k.rune == Rune(
          'A'.ord)):
        if selectedMenu == 0:
          editingConnId = -1
          isAddingConn = true
        elif selectedMenu == 3:
          editingCloudId = ""
          isAddingCloud = true
      elif k.code == kcChar and (k.rune == Rune('e'.ord) or k.rune == Rune(
          'E'.ord)):
        if selectedMenu == 0:
          if connections.len > 0 and configFilesIdx < connections.len:
            let c = connections[configFilesIdx]
            editingConnId = c.id
            formValues = [c.name, c.engine, c.host, $c.port, c.user, c.dbname,
                decryptPassword(c.encrypted_password), c.schema]
            isAddingConn = true
        elif selectedMenu == 3:
          if cloudProviders.len > 0 and cloudFilesIdx < cloudProviders.len:
            let c = cloudProviders[cloudFilesIdx]
            editingCloudId = c.id
            cloudFormValues = [c.name, c.provider_type, decryptCredentials(c.encrypted_credentials), c.metadata]
            isAddingCloud = true
      elif k.code == kcChar and (k.rune == Rune('c'.ord) or k.rune == Rune(
          'C'.ord)):
        if selectedMenu == 0:
          if connections.len > 0 and configFilesIdx < connections.len:
            let c = connections[configFilesIdx]
            editingConnId = -1
            formValues = [c.name & "_copy", c.engine, c.host, $c.port, c.user,
                c.dbname, decryptPassword(c.encrypted_password), c.schema]
            isAddingConn = true
        elif selectedMenu == 3:
          if cloudProviders.len > 0 and cloudFilesIdx < cloudProviders.len:
            let c = cloudProviders[cloudFilesIdx]
            editingCloudId = ""
            cloudFormValues = [c.name & "_copy", c.provider_type, decryptCredentials(c.encrypted_credentials), c.metadata]
            isAddingCloud = true
      elif k.code == kcChar and (k.rune == Rune('d'.ord) or k.rune == Rune(
          'D'.ord)):
        if selectedMenu == 0:
          if connections.len > 0 and configFilesIdx < connections.len:
            deleteConnection(connections[configFilesIdx].id)
            statusMsg = "STATUS: Connection deleted."
        elif selectedMenu == 2 and inFocus == 0:
          isCloudModalOpen = true
          cloudDumpIdx = 0
        elif selectedMenu == 3:
          if cloudProviders.len > 0 and cloudFilesIdx < cloudProviders.len:
            deleteCloudProvider(cloudProviders[cloudFilesIdx].id)
            statusMsg = "STATUS: Cloud Provider deleted."
      elif k.code == kcChar and (k.rune == Rune('u'.ord) or k.rune == Rune(
          'U'.ord)):
        if selectedMenu == 2 and inFocus == 0 and dumps.len > 0:
          if not isCloudOpActive:
            let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
            let dumpFile = "dumps" / dumps[restoreDumpIdx]
            let args = CloudTaskArgs(op: opUpload, config: conf, localFile: dumpFile, remoteKey: dumps[restoreDumpIdx], chanPtr: addr cloudChan, cancelPtr: addr cloudCancel)
            cloudCancel.store(false)
            createThread(cloudThread, cloudWorker, args)
            isCloudOpActive = true
      elif k.code == kcEnter:
        if selectedMenu == 1 and connections.len > 0 and backupFilesIdx <
            connections.len:
          let isUpload = (kmShift in k.mods)
          let conn = connections[backupFilesIdx]
          term.restore()
          echo "Starting backup for ", conn.name, "..."
          try:
            putEnv("PGPASSWORD", decryptPassword(conn.encrypted_password))
            let outPath = extractSchema(conn.host, $conn.port, conn.user,
                conn.dbname, conn.schema, "dumps")
            statusMsg = "STATUS: Backup created at " & outPath
            if isUpload and not isCloudOpActive:
              let conf = CloudConfig(accessKey: "valid", secretKey: "valid", region: "us-east-1", bucket: "bck", endpoint: "")
              let args = CloudTaskArgs(op: opUpload, config: conf, localFile: outPath, remoteKey: "remote.enc", chanPtr: addr cloudChan, cancelPtr: addr cloudCancel)
              cloudCancel.store(false)
              createThread(cloudThread, cloudWorker, args)
              isCloudOpActive = true
          except Exception as e:
            statusMsg = "STATUS: Backup failed: " & e.msg
          # Sleep to let user see echo
          sleep(1500)
          term.setup()
        elif selectedMenu == 2 and dumps.len > 0 and connections.len > 0:
          let dumpFile = "dumps" / dumps[restoreDumpIdx]
          let conn = connections[restoreConnIdx]
          term.restore()
          echo "Starting restore from ", dumpFile, " to ", conn.name, "..."
          try:
            putEnv("PGPASSWORD", decryptPassword(conn.encrypted_password))
            if restoreSchema(conn.host, $conn.port, conn.user, conn.dbname, dumpFile):
              statusMsg = "STATUS: Restored successfully."
              saveRestoreHistory(RestoreHistoryRecord(dump_file: dumpFile,
                  connection_name: conn.name, dbname: conn.dbname,
                  schema: conn.schema))
            else:
              statusMsg = "STATUS: Restore failed."
          except Exception as e:
            statusMsg = "STATUS: Restore error: " & e.msg
          sleep(1500)
          term.setup()
