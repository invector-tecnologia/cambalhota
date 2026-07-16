import illwill
import os, strutils
import core/migrations
import core/db

proc exitProc() {.noconv.} =
  illwillDeinit()
  showCursor()
  quit(0)

proc drawMenu(tb: var TerminalBuffer, selectedIdx: int) =
  let menuItems = [" Config ", " Backup ", " Restore / Migrations "]
  var x = 2
  let y = 1
  for i, item in menuItems:
    if i == selectedIdx:
      tb.setBackgroundColor(bgMagenta)
      tb.setForegroundColor(fgWhite)
      tb.write(x, y, item)
      tb.resetAttributes()
    else:
      tb.setForegroundColor(fgCyan)
      tb.write(x, y, item)
      tb.resetAttributes()
    x += item.len + 2

proc getFiles(menuIdx: int): seq[string] =
  result = @[]
  var path = ""
  if menuIdx == 1:
    path = "dumps"
  elif menuIdx == 2:
    path = "migrations/up"
  
  if path.len > 0 and dirExists(path):
    for kind, file in walkDir(path):
      if kind == pcFile or kind == pcLinkToFile:
        if file.endsWith(".sql"):
          result.add(file)

proc main() =
  illwillInit(fullscreen=true)
  setControlCHook(exitProc)
  hideCursor()

  var selectedMenu = 2 # 0: Config, 1: Backup, 2: Restore / Migrations
  var selectedFileIdx = 0
  var statusMsg = "STATUS: Ready. Press Left/Right to select, Up/Down for file, Enter to execute, Q to quit."
  
  let dbHost = getEnv("DB_HOST", "localhost")
  let dbPort = getEnv("DB_PORT", "5432")
  let dbUser = getEnv("DB_USER", "postgres")
  let dbName = getEnv("DB_NAME", "postgres")
  let dbConn = "postgresql://" & dbUser & "@" & dbHost & ":" & dbPort & "/" & dbName

  while true:
    var tw = terminalWidth()
    var th = terminalHeight()
    var tb = newTerminalBuffer(tw, th)
    
    tb.setBackgroundColor(bgBlack)
    tb.fill(0, 0, tw-1, th-1, " ")
    
    # Title Bar
    tb.setForegroundColor(fgMagenta, true)
    tb.write(2, 0, "=== CAMBALHOTA MIGRATION ENGINE (Retrowave TUI) ===")
    
    # Draw Menu
    drawMenu(tb, selectedMenu)

    let histX = 1
    let histY = 3
    let histW = tw div 3
    let histH = th - 4

    let viewX = histW + 2
    let viewY = 3
    let viewW = tw - histW - 3
    let viewH = th - 6

    let statY = th - 2

    let files = getFiles(selectedMenu)
    if files.len > 0 and selectedFileIdx >= files.len:
      selectedFileIdx = files.len - 1
    elif files.len == 0:
      selectedFileIdx = 0

    # Draw History Panel
    tb.setForegroundColor(fgCyan)
    tb.drawRect(histX, histY, histX + histW, histY + histH)
    tb.setForegroundColor(fgMagenta, true)
    tb.write(histX + 2, histY, " HISTORY / ACTIONS ")
    
    var cy = histY + 2
    for i, file in files:
      if cy >= histY + histH - 1: break
      if i == selectedFileIdx:
        tb.setBackgroundColor(bgWhite)
        tb.setForegroundColor(fgBlack)
        tb.write(histX + 2, cy, file.extractFilename())
        tb.resetAttributes()
      else:
        tb.setForegroundColor(fgWhite)
        tb.write(histX + 2, cy, file.extractFilename())
      cy += 1

    # Draw Code Panel
    tb.setForegroundColor(fgCyan)
    tb.drawRect(viewX, viewY, viewX + viewW, viewY + viewH)
    tb.setForegroundColor(fgMagenta, true)
    tb.write(viewX + 2, viewY, " FILE VIEWER ")
    
    if files.len > 0 and selectedFileIdx < files.len:
      let path = files[selectedFileIdx]
      if fileExists(path):
        let content = readFile(path)
        let lines = content.splitLines()
        var fcy = viewY + 2
        for i, line in lines:
          if fcy >= viewY + viewH - 1: break
          var displayLine = line
          if displayLine.len > viewW - 4:
            displayLine = displayLine[0 .. max(0, viewW - 5)]
          tb.setForegroundColor(fgGreen)
          tb.write(viewX + 2, fcy, displayLine)
          fcy += 1

    # Status Panel
    tb.setForegroundColor(fgCyan)
    tb.drawRect(viewX, statY - 1, viewX + viewW, statY + 1)
    tb.setForegroundColor(fgYellow)
    
    var truncStatusMsg = statusMsg
    if truncStatusMsg.len > viewW - 4:
        truncStatusMsg = truncStatusMsg[0 .. max(0, viewW - 5)]
    tb.write(viewX + 2, statY, truncStatusMsg)
    
    tb.display()

    let key = getKey()
    case key
    of Key.None: sleep(50)
    of Key.Q, Key.Escape: exitProc()
    of Key.Left:
      if selectedMenu > 0: 
        selectedMenu.dec
        selectedFileIdx = 0
        statusMsg = "STATUS: Ready."
    of Key.Right:
      if selectedMenu < 2: 
        selectedMenu.inc
        selectedFileIdx = 0
        statusMsg = "STATUS: Ready."
    of Key.Up:
      if selectedFileIdx > 0: selectedFileIdx.dec
    of Key.Down:
      if files.len > 0 and selectedFileIdx < files.len - 1: selectedFileIdx.inc
    of Key.Enter:
      if files.len > 0 and selectedFileIdx < files.len:
        let file = files[selectedFileIdx]
        try:
          if selectedMenu == 1:
            if restoreSchema(dbHost, dbPort, dbUser, dbName, file):
              statusMsg = "STATUS: Restored schema from " & file.extractFilename()
            else:
              statusMsg = "STATUS: Failed to restore schema."
          elif selectedMenu == 2:
            let m = parseMigrationFilename(file.extractFilename())
            if executeMigration(m, dbConn):
              statusMsg = "STATUS: Executed migration " & file.extractFilename()
            else:
              statusMsg = "STATUS: Failed to execute migration."
        except Exception as e:
          statusMsg = "STATUS: Error - " & e.msg
    else:
      discard

when isMainModule:
  main()
