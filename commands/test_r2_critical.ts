/**
 * Script de teste para R2Logger
 * Testa envio imediato de logs críticos ao Cloudflare R2
 *
 * Para rodar:
 * 1. Configure as variáveis de ambiente R2
 * 2. node ace test:r2:critical
 */

import { BaseCommand } from '@adonisjs/core/ace'
import cloudLogger from '#services/cloud_logger'

export default class TestR2Critical extends BaseCommand {
  static commandName = 'test:r2:critical'
  static description = 'Testa envio imediato de logs críticos ao R2'

  async run() {
    this.logger.info('🧪 Iniciando teste de envio imediato de logs críticos ao R2...\n')

    // Teste 1: Login bem-sucedido
    this.logger.info('1️⃣ Testando: LOGIN_SUCCESS')
    cloudLogger.info('LOGIN_SUCCESS', {
      userId: 9999,
      email: 'teste@example.com',
      empresaId: 1,
      cnpj: '12345678901234',
      timestamp: new Date().toISOString(),
    })
    this.logger.success('✅ Log enviado (verificar no Heroku logs e no R2)\n')

    await this.sleep(2000)

    // Teste 2: Emissão fiscal
    this.logger.info('2️⃣ Testando: FISCAL_EMIT_START')
    cloudLogger.info('FISCAL_EMIT_START', {
      orderId: 123,
      establishmentId: 1,
      cnpj: '12345678901234',
      timestamp: new Date().toISOString(),
    })
    this.logger.success('✅ Log enviado\n')

    await this.sleep(2000)

    // Teste 3: Abertura de caixa
    this.logger.info('3️⃣ Testando: CAIXA_OPENED')
    cloudLogger.info('CAIXA_OPENED', {
      userId: 1,
      empresaId: 1,
      cnpj: '12345678901234',
      openingBalance: 100.0,
      registroId: 456,
      timestamp: new Date().toISOString(),
    })
    this.logger.success('✅ Log enviado\n')

    await this.sleep(2000)

    // Teste 4: Erro fiscal
    this.logger.info('4️⃣ Testando: FISCAL_EMIT_FAILED')
    cloudLogger.error('FISCAL_EMIT_FAILED', {
      orderId: 789,
      cnpj: '12345678901234',
      error: 'Teste de erro simulado',
      timestamp: new Date().toISOString(),
    })
    this.logger.success('✅ Log enviado\n')

    this.logger.info('⏳ Aguardando 5 segundos para envios assíncronos...')
    await this.sleep(5000)

    this.logger.success('\n✅ Teste concluído!')
    this.logger.info('\n📋 Verificação:')
    this.logger.info('1. Execute: heroku logs --tail | grep "\\[HEROKU\\]"')
    this.logger.info('2. Verifique o Cloudflare R2 na pasta: logs/critical/')
    this.logger.info('3. Deve haver 4 novos arquivos JSON com os logs\n')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
