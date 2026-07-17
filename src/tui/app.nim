import std/[os, options, unicode, deques, strutils]
import tatui
import tatui/event/reader
import msg
import ../core/extract

const MaxLogs = 100

type
  AppState* = enum
    stRunning, stSuccess, stError

proc runTui*(conf: ExtractorConfig) =
  open(logChannel)
  defer: close(logChannel)

  var term = newTerminal(newAnsiBackend())
  term.setup()
  defer: term.restore()

  var
    running = true
    state = stRunning
    logs = initDeque[string](initialSize = MaxLogs)
    errMsg = ""
    listState = ListState()
    
  startExtraction(conf)

  while running:
    # 1. Handle UI events
    let evOpt = pollEvent(10) # 10ms timeout
    if evOpt.isSome:
      let ev = evOpt.get()
      if ev.kind == evKey and ev.key.code == kcChar and ev.key.rune.toUTF8() == "q":
        running = false
      elif ev.kind == evKey and ev.key.code == kcUp:
        listState.offset = max(0, listState.offset - 1)
      elif ev.kind == evKey and ev.key.code == kcDown:
        listState.offset += 1
    
    # 2. Poll channel
    var msgOpt = logChannel.tryRecv()
    while msgOpt.dataAvailable:
      let msg = msgOpt.msg
      case msg.kind
      of mkLog:
        if logs.len >= MaxLogs:
          discard logs.popFirst()
        logs.addLast(msg.text)
        listState.offset = max(0, logs.len - term.currentArea().height.int + 4)
      of mkSuccess:
        state = stSuccess
      of mkError:
        state = stError
        errMsg = msg.text
      msgOpt = logChannel.tryRecv()

    # 3. Draw
    term.draw(proc(f: var Frame) =
      let area = f.area()
      var bColor = White
      if state == stSuccess:
        bColor = Green
      elif state == stError:
        bColor = Red
        
      var items: seq[ListItem]
      for line in logs:
        items.add(listItem(line))
        
      if errMsg.len > 0:
        items.add(listItem("ERROR: " & errMsg, style(fg = some(Red))))

      let blk = initBlock(
        title = " Cambalhota TUI [Press 'q' to quit] - " & $state & " ",
        titleAlignment = alLeft,
        borders = AllBorders,
        borderStyle = style(fg = some(bColor))
      )
      
      var lst = list(items, blk = some(blk))
      lst.render(area, f.buf[], listState)
    )

  joinExtraction()
