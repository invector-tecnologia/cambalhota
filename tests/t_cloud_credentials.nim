import unittest, os, std/json
import ../src/db/storage

suite "Secure Cloud Credentials Management":
  setup:
    # Use a temporary DB for tests
    let home = getTempDir() / "cambalhota_credentials_test"
    createDir(home)
    putEnv("HOME", home)
    initDb()

  test "Creates a new S3 provider from the TUI (storage/logic)":
    var credsJson = %*{"access_key_id": "Access Key", "secret_access_key": "Secret Key"}
    var metaJson = %*{"region": "us-east-1", "bucket": "my-bucket"}
    
    var rec = CloudProviderRecord(
      name: "My AWS Bucket",
      provider_type: "s3",
      encrypted_credentials: $credsJson,
      metadata: $metaJson
    )
    
    saveCloudProvider(rec)
    
    let provs = listCloudProviders()
    check provs.len == 1
    check provs[0].name == "My AWS Bucket"
    check provs[0].encrypted_credentials != $credsJson # Must be encrypted
    check decryptCredentials(provs[0].encrypted_credentials) == $credsJson
    
  test "Updates the credentials of a cloud provider":
    var provs = listCloudProviders()
    var rec = provs[0]
    
    var newCreds = %*{"access_key_id": "New Access", "secret_access_key": "New Secret"}
    rec.encrypted_credentials = $newCreds
    
    updateCloudProvider(rec.id, rec)
    
    let updatedProvs = listCloudProviders()
    check decryptCredentials(updatedProvs[0].encrypted_credentials) == $newCreds
    
  test "Deletes a cloud provider":
    var provs = listCloudProviders()
    deleteCloudProvider(provs[0].id)
    
    let finalProvs = listCloudProviders()
    check finalProvs.len == 0

  teardown:
    removeFile(getDbPath())
