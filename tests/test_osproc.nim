import osproc, streams
let p = startProcess("ls", options = {poUsePath})
let err = p.errorStream
