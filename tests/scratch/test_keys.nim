import std/os
import tatui, tatui/event/reader

var term = newTerminal(newAnsiBackend())
term.setup()
defer: term.restore()

while true:
  let evOpt = pollEvent(50)
  if evOpt.isSome and evOpt.get.kind == evKey:
    let k = evOpt.get.key
    # Just quit when q is pressed
    if k.code == kcChar and k.rune == Rune('q'.ord): break
