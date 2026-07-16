/**
 * Script de teste para CloudLogger e upload R2
 * Adiciona logs de teste e executa o worker para upload
 */

async function testCloudLogger() {
  console.log('🧪 Teste CloudLogger + R2 Upload')

  try {
    // 1. Importa o CloudLogger
    console.log('1️⃣ Importando CloudLogger...')
    const cloudLoggerModule = await import('./build/app/services/cloud_logger.js')
    const cloudLogger = cloudLoggerModule.default

    // 2. Adiciona logs de teste
    console.log('2️⃣ Adicionando logs de teste...\n')
    
    cloudLogger.info('🚀 Teste de log INFO', {
      timestamp: new Date().toISOString(),
      teste: true,
      ambiente: 'desenvolvimento',
    })

    cloudLogger.warn('⚠️ Teste de log WARN', {
      mensagem: 'Isto é um aviso de teste',
      level: 'warning',
    })

    cloudLogger.error('❌ Teste de log ERROR', {
      erro: 'Erro simulado para teste',
      codigo: 'TEST_ERROR_001',
    })

    cloudLogger.debug('🔍 Teste de log DEBUG', {
      debug: true,
      dados: {
        usuario: 'teste',
        operacao: 'test-r2-upload',
      },
    })

    // Adiciona mais alguns logs para ter um batch maior
    for (let i = 1; i <= 5; i++) {
      cloudLogger.info(`📋 Log de teste #${i}`, {
        numero: i,
        batch: 'teste-r2',
        timestamp: new Date().toISOString(),
      })
    }

    const bufferSize = cloudLogger.getBufferSize()
    console.log(`\n✅ ${bufferSize} logs adicionados ao buffer\n`)

    // 3. Aguarda um pouco
    console.log('3️⃣ Aguardando 2 segundos...\n')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 4. Instrui executar o worker
    console.log('4️⃣ Agora execute o worker em outro terminal:\n')
    console.log('   export LOG_UPLOAD_ENABLED=true')
    console.log('   node ace upload:logs:worker\n')
    console.log('   Ou aguarde 30 segundos se o worker já estiver rodando.\n')

    console.log('5️⃣ Verificar logs no R2:')
    console.log('   • Acesse: https://dash.cloudflare.com/')
    console.log('   • R2 → tavolo → pasta logs/')
    console.log('   • Procure por arquivo JSON recente\n')

    console.log('═══════════════════════════════════')
    console.log('═══════════════════════════════════\n')

  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

testCloudLogger()
