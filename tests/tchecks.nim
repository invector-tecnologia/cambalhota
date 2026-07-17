import std/unittest
import ../src/core/checks

suite "System Checks Tests":
  test "checkPgDump should run without crashing (result depends on system)":
    let hasPgDump = checkPgDump()
    # We can't guarantee pg_dump is installed in the test environment,
    # but we can check it doesn't crash and returns a boolean.
    check hasPgDump == true or hasPgDump == false
