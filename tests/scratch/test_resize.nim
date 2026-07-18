import tatui, tatui/event/reader, os, std/unicode

proc main() =
  var term = newTerminal(newAnsiBackend())
  term.setup()
  defer: term.restore()

  while true:
    term.draw(f):
      f.renderWidget(paragraph(text("Resize me"), style = defaultStyle()), f.area)
    let evOpt = pollEvent(50)
    if evOpt.isSome:
      if evOpt.get.kind == evKey and evOpt.get.key.code == kcChar and evOpt.get.key.rune == Rune('q'.ord): break

main()
