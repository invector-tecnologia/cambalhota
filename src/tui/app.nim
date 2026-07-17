import std/[os, options, unicode, deques, strutils]
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
  ____    _    __  __ ____    _    _     _   _  ___ _____  _    
 / ___|  / \  |  \/  | __ )  / \  | |   | | | |/ _ \_   _|/ \   
| |     / _ \ | |\/| |  _ \ / _ \ | |   | |_| | | | || | / _ \  
| |___ / ___ \| |  | | |_) / ___ \| |___|  _  | |_| || |/ ___ \ 
 \____/_/   \_\_|  |_|____/_/   \_\_____|_| |_|\___/ |_/_/   \_\
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
    selectedMenu = 0 # 0: Config, 1: Backup, 2: Restore
    statusMsg = "STATUS: Ready. [Left/Right] Tabs | [Up/Down] Navigate | [Enter] Select | [A] Add | [D] Del | [Q] Quit"
    inFocus = 0 # 0: left, 1: right (for cross-restore)
    listStConfig: ListState
    listStBackup: ListState
    listStRestoreDump: ListState
    listStRestoreConn: ListState
    configFilesIdx, backupFilesIdx, restoreDumpIdx, restoreConnIdx = 0

  while running:
    let connections = listConnections()
    let dumps = getFiles("dumps")
    
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

    term.draw proc(f: var Frame) =
      let mainChunks = f.area.split(Vertical, @[length(7), length(1), fill(1), length(3)])
      let logoRect = mainChunks[0]
      let headerRect = mainChunks[1]
      let bodyRect = mainChunks[2]
      let statusRect = mainChunks[3]

      f.renderWidget(paragraph(text(LogoAscii), style = defaultStyle().fg(Magenta)), logoRect)

      let menuItems = @[" 1. Config ", " 2. Backup ", " 3. Restore "]
      var t = tabs(menuItems, selected = selectedMenu, highlightStyle = defaultStyle().bg(Magenta).fg(Black))
      t.style = defaultStyle().fg(Cyan)
      f.renderWidget(t, headerRect)

      if selectedMenu == 0:
        var items: seq[ListItem]
        for c in connections:
          items.add listItem(c.name & " [" & c.engine & "] - " & c.user & "@" & c.host & ":" & $c.port & "/" & c.dbname, style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(title = " CONNECTIONS [Press A to Add, D to Delete] ", borders = AllBorders, borderStyle = defaultStyle().fg(Blue)))),
          bodyRect, listStConfig
        )
      elif selectedMenu == 1:
        var items: seq[ListItem]
        for c in connections:
          items.add listItem(c.name & " [" & c.engine & "] - " & c.user & "@" & c.host & ":" & $c.port & "/" & c.dbname, style = defaultStyle().fg(White))
        f.renderStateful(
          list(items, blk = some(initBlock(title = " SELECT CONNECTION TO BACKUP [Press Enter] ", borders = AllBorders, borderStyle = defaultStyle().fg(Green)))),
          bodyRect, listStBackup
        )
      elif selectedMenu == 2:
        let hChunks = bodyRect.split(Horizontal, @[pct(50), pct(50)])
        var dumpItems: seq[ListItem]
        for d in dumps: dumpItems.add listItem(d.extractFilename(), style = defaultStyle().fg(White))
        let leftBColor = if inFocus == 0: Yellow else: Blue
        f.renderStateful(
          list(dumpItems, blk = some(initBlock(title = " 1. SOURCE DUMP ", borders = AllBorders, borderStyle = defaultStyle().fg(leftBColor)))),
          hChunks[0], listStRestoreDump
        )
        var connItems: seq[ListItem]
        for c in connections: connItems.add listItem(c.name & " [" & c.engine & "]", style = defaultStyle().fg(White))
        let rightBColor = if inFocus == 1: Yellow else: Blue
        f.renderStateful(
          list(connItems, blk = some(initBlock(title = " 2. TARGET CONNECTION ", borders = AllBorders, borderStyle = defaultStyle().fg(rightBColor)))),
          hChunks[1], listStRestoreConn
        )

      f.renderWidget(paragraph(text(statusMsg), blk = some(initBlock(borders = AllBorders, borderStyle = defaultStyle().fg(Cyan))), style = defaultStyle().fg(Yellow)), statusRect)

    let evOpt = pollEvent(50)
    if evOpt.isSome and evOpt.get.kind == evKey:
      let k = evOpt.get.key
      if k.code == kcChar and (k.rune == Rune('q'.ord) or k.rune == Rune('Q'.ord)):
        running = false
      elif k.code == kcLeft:
        if selectedMenu == 2 and inFocus == 1: inFocus = 0
        elif selectedMenu > 0: selectedMenu.dec; statusMsg = "STATUS: Ready."
      elif k.code == kcRight:
        if selectedMenu == 2 and inFocus == 0: inFocus = 1
        elif selectedMenu < 2: selectedMenu.inc; statusMsg = "STATUS: Ready."
      elif k.code == kcUp:
        if selectedMenu == 0 and configFilesIdx > 0: configFilesIdx.dec
        elif selectedMenu == 1 and backupFilesIdx > 0: backupFilesIdx.dec
        elif selectedMenu == 2:
          if inFocus == 0 and restoreDumpIdx > 0: restoreDumpIdx.dec
          elif inFocus == 1 and restoreConnIdx > 0: restoreConnIdx.dec
      elif k.code == kcDown:
        if selectedMenu == 0 and connections.len > 0 and configFilesIdx < connections.len - 1: configFilesIdx.inc
        elif selectedMenu == 1 and connections.len > 0 and backupFilesIdx < connections.len - 1: backupFilesIdx.inc
        elif selectedMenu == 2:
          if inFocus == 0 and dumps.len > 0 and restoreDumpIdx < dumps.len - 1: restoreDumpIdx.inc
          elif inFocus == 1 and connections.len > 0 and restoreConnIdx < connections.len - 1: restoreConnIdx.inc
      elif k.code == kcChar and (k.rune == Rune('a'.ord) or k.rune == Rune('A'.ord)) and selectedMenu == 0:
        term.restore()
        echo "\n=== ADD NEW CONNECTION ==="
        stdout.write("Name (unique): "); let cName = stdin.readLine().strip()
        stdout.write("Engine (pg, mysql): "); let cEngine = stdin.readLine().strip()
        stdout.write("Host: "); let cHost = stdin.readLine().strip()
        stdout.write("Port: "); let cPortStr = stdin.readLine().strip()
        stdout.write("User: "); let cUser = stdin.readLine().strip()
        stdout.write("DB Name: "); let cDb = stdin.readLine().strip()
        stdout.write("Password: "); let cPass = stdin.readLine().strip()
        stdout.write("Schema (default: Cambalhota): "); var cSchema = stdin.readLine().strip()
        if cSchema == "": cSchema = "Cambalhota"
        try:
          let cPort = parseInt(cPortStr)
          saveConnection(ConnectionRecord(name: cName, engine: cEngine, host: cHost, port: cPort, user: cUser, dbname: cDb, encrypted_password: cPass, schema: cSchema))
          statusMsg = "STATUS: Connection saved."
        except Exception as e:
          statusMsg = "STATUS: Failed to save: " & e.msg
        term.setup()
      elif k.code == kcChar and (k.rune == Rune('d'.ord) or k.rune == Rune('D'.ord)) and selectedMenu == 0:
        if connections.len > 0 and configFilesIdx < connections.len:
          deleteConnection(connections[configFilesIdx].id)
          statusMsg = "STATUS: Connection deleted."
      elif k.code == kcEnter:
        if selectedMenu == 1 and connections.len > 0 and backupFilesIdx < connections.len:
          let conn = connections[backupFilesIdx]
          term.restore()
          echo "Starting backup for ", conn.name, "..."
          try:
            putEnv("PGPASSWORD", decryptPassword(conn.encrypted_password))
            let outPath = extractSchema(conn.host, $conn.port, conn.user, conn.dbname, conn.schema, "dumps")
            statusMsg = "STATUS: Backup created at " & outPath
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
            else:
               statusMsg = "STATUS: Restore failed."
          except Exception as e:
            statusMsg = "STATUS: Restore error: " & e.msg
          sleep(1500)
          term.setup()
