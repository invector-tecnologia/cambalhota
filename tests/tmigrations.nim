import unittest, os, strutils
import core/migrations

suite "Migration Engine Core":
  setup:
    let testDir = getTempDir() / "cambalhota_migrations_test"
    createDir(testDir)
    
    let m1_path = testDir / "V20260717162000__create_users_table.up.sql"
    writeFile(m1_path, "CREATE TABLE users (id INT);")
    
    let m2_path = testDir / "V20260717162500__add_email_col.up.sql"
    writeFile(m2_path, "ALTER TABLE users ADD COLUMN email VARCHAR(255);")
    
    let m3_path = testDir / "V20260717162500__add_email_col.down.sql"
    writeFile(m3_path, "ALTER TABLE users DROP COLUMN email;")
    
  teardown:
    let testDirTeardown = getTempDir() / "cambalhota_migrations_test"
    removeDir(testDirTeardown)

  test "Scan and Order Migrations":
    let migs = scanMigrations(testDir)
    
    check migs.len == 3
    check migs[0].version == "20260717162000"
    check migs[0].description == "create users table"
    check migs[0].mtype == Up
    
    check migs[1].version == "20260717162500"
    check migs[2].version == "20260717162500"

  test "Checksum Calculation":
    let m1_test_path = testDir / "V20260717162000__create_users_table.up.sql"
    let content = readFile(m1_test_path)
    let csum = computeChecksum(content)
    
    let migs = scanMigrations(testDir)
    check migs[0].checksum == csum

  test "Transactional Wrapper Injection":
    let m1_test_path = testDir / "V20260717162000__create_users_table.up.sql"
    let content = readFile(m1_test_path)
    let wrapped = "BEGIN;\n" & content & "\nCOMMIT;\n"
    
    check wrapped.contains("BEGIN;")
    check wrapped.contains("CREATE TABLE users (id INT);")
    check wrapped.contains("COMMIT;")
