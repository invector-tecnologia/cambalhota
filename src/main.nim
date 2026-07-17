import tatui
import os, strutils, options, unicode
import core/migrations
import core/db

proc exitProc() {.noconv.} =
  quit(0)

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
  setControlCHook(exitProc)

  var term = newTerminal(newAnsiBackend())
  term.setup()
  defer: term.restore()

  var selectedMenu = 2 # 0: Config, 1: Backup, 2: Restore / Migrations
  var selectedFileIdx = 0
  var statusMsg = "STATUS: Ready. Press Left/Right to select, Up/Down for file, Enter to execute, Q to quit."

  let dbHost = getEnv("DB_HOST", "localhost")
  let dbPort = getEnv("DB_PORT", "5432")
  let dbUser = getEnv("DB_USER", "postgres")
  let dbName = getEnv("DB_NAME", "postgres")
  let dbConn = "postgresql://" & dbUser & "@" & dbHost & ":" & dbPort & "/" & dbName

  var listSt: ListState
  var running = true

  while running:
    let files = getFiles(selectedMenu)
    if files.len > 0 and selectedFileIdx >= files.len:
      selectedFileIdx = files.len - 1
    elif files.len == 0:
      selectedFileIdx = 0

    if files.len > 0:
      listSt.select(selectedFileIdx)
    else:
      listSt.selected = none(int)

    term.draw proc(f: var Frame) =
      let vChunks = f.area.split(Vertical, @[length(1), length(1), fill(1),
          length(3)])
      let titleRect = vChunks[0]
      let headerRect = vChunks[1]
      let bodyRect = vChunks[2]
      let statusRect = vChunks[3]

      # Title
      f.renderWidget(paragraph(text("=== CAMBALHOTA MIGRATION ENGINE (Retrowave TUI) ==="),
          style = defaultStyle().fg(Blue)), titleRect)

      # Menu / Tabs
      let menuItems = @[" Config ", " Backup ", " Restore / Migrations "]
      var t = tabs(menuItems, selected = selectedMenu,
          highlightStyle = defaultStyle().bg(Blue).fg(Black))
      t.style = defaultStyle().fg(Cyan)
      f.renderWidget(t, headerRect)

      # Body split
      let hChunks = bodyRect.split(Horizontal, @[pct(33), pct(67)])
      let histRect = hChunks[0]
      let viewRect = hChunks[1]

      # History Panel
      var items: seq[ListItem]
      for file in files:
        items.add listItem(file.extractFilename(), style = defaultStyle().fg(White))

      f.renderStateful(
        list(items, blk = some(initBlock(title = " HISTORY / ACTIONS ", borders = AllBorders, borderStyle = defaultStyle().fg(Blue), titleStyle = defaultStyle().fg(Blue))),
             highlightStyle = defaultStyle().bg(White).fg(Black)),
        histRect, listSt
      )

      # Code Panel
      var codeContent = ""
      if files.len > 0 and selectedFileIdx < files.len:
        let path = files[selectedFileIdx]
        if fileExists(path):
          codeContent = readFile(path)

      f.renderWidget(
        paragraph(text(codeContent), blk = some(initBlock(
            title = " FILE VIEWER ", borders = AllBorders,
            borderStyle = defaultStyle().fg(Blue), titleStyle = defaultStyle(
        ).fg(Blue))), style = defaultStyle().fg(Green)),
        viewRect
      )

      # Status Panel
      f.renderWidget(
        paragraph(text(statusMsg), blk = some(initBlock(borders = AllBorders,
            borderStyle = defaultStyle().fg(Cyan))), style = defaultStyle().fg(
            Yellow)),
        statusRect
      )

    let ev = pollEvent(50)
    if ev.isSome and ev.get.kind == evKey:
      let k = ev.get.key
      if k.code == kcChar and (kmCtrl in k.mods) and (k.rune == Rune('q'.ord) or k.rune == Rune('Q'.ord)):
        running = false
      elif k.code == kcLeft:
        if selectedMenu > 0:
          selectedMenu.dec
          selectedFileIdx = 0
          statusMsg = "STATUS: Ready."
      elif k.code == kcRight:
        if selectedMenu < 2:
          selectedMenu.inc
          selectedFileIdx = 0
          statusMsg = "STATUS: Ready."
      elif k.code == kcUp:
        if selectedFileIdx > 0: selectedFileIdx.dec
      elif k.code == kcDown:
        if files.len > 0 and selectedFileIdx < files.len -
            1: selectedFileIdx.inc
      elif k.code == kcEnter:
        if files.len > 0 and selectedFileIdx < files.len:
          let file = files[selectedFileIdx]
          try:
            if selectedMenu == 1:
              if restoreSchema(dbHost, dbPort, dbUser, dbName, file):
                statusMsg = "STATUS: Restored schema from " &
                    file.extractFilename()
              else:
                statusMsg = "STATUS: Failed to restore schema."
            elif selectedMenu == 2:
              let mFull = parseMigrationFilename(file)
              if applyMigration(dbHost, dbPort, dbUser, dbName, mFull):
                statusMsg = "STATUS: Executed migration " &
                    file.extractFilename()
              else:
                statusMsg = "STATUS: Failed to execute migration."
          except Exception as e:
            statusMsg = "STATUS: Error - " & e.msg

when isMainModule:
  main()
