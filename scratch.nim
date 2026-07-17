import os, strutils
import ./src/core/restore

let base = getHomeDir() / ".cambalhota" / "db_dumps" / "2026"
createDir(base)
writeFile(base / "test_dump.enc", "mock")
echo listLocalBackups("2026")
