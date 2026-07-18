type
  MsgKind* = enum
    mkLog
    mkProgress
    mkSuccess
    mkError

  Msg* = object
    case kind*: MsgKind
    of mkLog, mkError:
      text*: string
    of mkProgress:
      bytesRead*: int64
      totalBytes*: int64
    of mkSuccess:
      discard

var logChannel*: Channel[Msg]
