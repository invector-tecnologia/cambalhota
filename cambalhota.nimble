version       = "1.0.2"
author        = "Eng"
description   = "Cambalhota Backup Tool"
license       = "MIT"
srcDir        = "src"
bin           = @["cambalhota"]

requires "nim >= 2.0.0"
requires "tatui"
requires "nimcrypto"
requires "zippy"
requires "db_connector"
