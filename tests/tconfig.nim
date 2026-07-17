import std/unittest
import ../src/db/config

suite "Database Configuration Tests":
  test "Default configuration must use 'Cambalhota' schema and 'require' sslMode":
    let conf = initPgConfig("localhost", "user", "pass", "mydb")
    check conf.schema == "Cambalhota"
    check conf.sslMode == "require"
    check conf.port == 5432
    check conf.host == "localhost"

  test "Should allow overriding schema for valid reasons (though not recommended for general use)":
    let conf = initPgConfig("localhost", "user", "pass", "mydb", schema = "OtherSchema")
    check conf.schema == "OtherSchema"
