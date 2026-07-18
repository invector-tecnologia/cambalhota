import unittest, os, std/json
import ../src/db/storage

suite "Gerenciamento Seguro de Credenciais Cloud":
  setup:
    # Use a temporary DB for tests
    putEnv("HOME", getTempDir())
    initDb()

  test "Criação de um novo provedor S3 com sucesso pela TUI (Banco/Logica)":
    var credsJson = %*{"access_key_id": "Access Key", "secret_access_key": "Secret Key"}
    var metaJson = %*{"region": "us-east-1", "bucket": "meubucket"}
    
    var rec = CloudProviderRecord(
      name: "Meu Bucket AWS",
      provider_type: "s3",
      encrypted_credentials: $credsJson,
      metadata: $metaJson
    )
    
    saveCloudProvider(rec)
    
    let provs = listCloudProviders()
    check provs.len == 1
    check provs[0].name == "Meu Bucket AWS"
    check provs[0].encrypted_credentials != $credsJson # Must be encrypted
    check decryptCredentials(provs[0].encrypted_credentials) == $credsJson
    
  test "Atualização das credenciais de um provedor Cloud":
    var provs = listCloudProviders()
    var rec = provs[0]
    
    var newCreds = %*{"access_key_id": "New Access", "secret_access_key": "New Secret"}
    rec.encrypted_credentials = $newCreds
    
    updateCloudProvider(rec.id, rec)
    
    let updatedProvs = listCloudProviders()
    check decryptCredentials(updatedProvs[0].encrypted_credentials) == $newCreds
    
  test "Exclusão de um provedor Cloud":
    var provs = listCloudProviders()
    deleteCloudProvider(provs[0].id)
    
    let finalProvs = listCloudProviders()
    check finalProvs.len == 0

  teardown:
    removeFile(getDbPath())
