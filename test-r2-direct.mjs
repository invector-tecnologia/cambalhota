// Teste de upload R2
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const config = {
  accessKeyId: '80cbad7afc2f549633f61ad4c6ebeb3a',
  secretAccessKey: 'ef9e497b37cd683b3b22f27ce1fbed39e852719cf33c2fa6a2c5af46d0bd20f2',
  endpoint: 'https://c7c1aeaf67d0e90a23ea7d919c8fda0a.r2.cloudflarestorage.com',
  bucket: 'tavolo',
}

console.log('🧪 Teste de Upload para Cloudflare R2\n')
console.log('1️⃣ Configurando cliente S3...')

const s3Client = new S3Client({
  region: 'auto',
  endpoint: config.endpoint,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
})

console.log('2️⃣ Preparando logs de teste...')
const testLogs = [
  {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: '🚀 Teste de upload CloudLogger para R2',
    data: { teste: true, ambiente: 'desenvolvimento', from: 'tavolo-app' },
  },
  {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: '⚠️ Log de aviso de teste',
    data: { warning: 'teste de sistema de logs' },
  },
  {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: '❌ Log de erro simulado',
    data: { error: 'simulado para teste', codigo: 'TEST001' },
  },
  {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: '📊 Log com dados estruturados',
    data: {
      usuario: 'teste',
      operacao: 'validacao-r2',
      sucesso: true,
      duracao: '1.23s',
    },
  },
]

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const key = `logs/teste-${timestamp}.json`

console.log(`3️⃣ Fazendo upload para R2...`)
console.log(`   Bucket: ${config.bucket}`)
console.log(`   Key: ${key}`)
console.log(`   Logs: ${testLogs.length} entradas\n`)

try {
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: JSON.stringify(testLogs, null, 2),
    ContentType: 'application/json',
  })

  const result = await s3Client.send(command)

  console.log('═══════════════════════════════════════════════')
  console.log('✅ UPLOAD REALIZADO COM SUCESSO!')
  console.log('═══════════════════════════════════════════════\n')
  console.log(`📁 Arquivo: ${key}`)
  console.log(`📊 Logs enviados: ${testLogs.length}`)
  console.log(`🔗 ETag: ${result.ETag}`)
  console.log('\n🔍 Verificar no Cloudflare:')
  console.log('   1. Acesse: https://dash.cloudflare.com/')
  console.log('   2. R2 Object Storage')
  console.log(`   3. Bucket: ${config.bucket}`)
  console.log(`   4. Pasta: logs/`)
  console.log(`   5. Arquivo: teste-${timestamp}.json\n`)
} catch (error) {
  console.error('\n❌ ERRO NO UPLOAD')
  console.error('═══════════════════════════════════════════════\n')
  console.error('Mensagem:', error.message)
  if (error.$metadata) {
    console.error('HTTP Status:', error.$metadata.httpStatusCode)
    console.error('Request ID:', error.$metadata.requestId)
  }
  console.error('\nStack:', error.stack)
  process.exit(1)
}
