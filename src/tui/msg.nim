type
  MsgKind* = enum
    mkLog
    mkSuccess
    mkError

  Msg* = object
    case kind*: MsgKind
    of mkLog, mkError:
      text*: string
    of mkSuccess:
      discard

var logChannel*: Channel[Msg]
