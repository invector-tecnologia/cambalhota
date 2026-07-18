import tatui, tatui/core/rect, tatui/layout/solver, tatui/layout/constraint

proc test() =
  let r = rect(0, 0, 10, 5) # Tiny rect
  let mainChunks = r.split(Vertical, @[length(7), length(3), fill(1), length(3)])
  let bodyRect = mainChunks[2]
  let bodyChunks = bodyRect.split(Horizontal, @[fill(1), length(35)])
  let contentRect = bodyChunks[0]
  let helpRect = bodyChunks[1]
  let hChunks = contentRect.split(Horizontal, @[pct(50), pct(50)])
  echo hChunks
test()
