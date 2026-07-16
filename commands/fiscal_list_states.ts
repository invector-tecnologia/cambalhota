import { BaseCommand } from '@adonisjs/core/ace'
import FiscalRoutingService from '#services/fiscal_routing_service'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Comando para listar todas as UFs suportadas e seus autorizadores
 * Uso: node ace fiscal:list-states
 */
export default class ListFiscalStates extends BaseCommand {
  static commandName = 'fiscal:list-states'
  static description = 'Lista todas as UFs suportadas para NFC-e e seus autorizadores'

  static options: CommandOptions = {
    startApp: false,
  }

  async run() {
    this.logger.info('🌎 Estados suportados para emissão de NFC-e:\n')

    const ufs = FiscalRoutingService.getSupportedUFs()

    // Agrupar por autorizador
    const grouped: Record<string, string[]> = {}

    for (const uf of ufs) {
      const autorizador = FiscalRoutingService.getAutorizador(uf)
      if (!grouped[autorizador]) {
        grouped[autorizador] = []
      }
      grouped[autorizador].push(uf)
    }

    // Exibir por grupo
    const colors = this.colors

    for (const [autorizador, estados] of Object.entries(grouped)) {
      const count = estados.length
      const percentage = ((count / 27) * 100).toFixed(1)

      this.logger.info(colors.cyan(`\n📡 ${autorizador} (${count} estados - ${percentage}%)`))
      this.logger.info(`   ${estados.join(', ')}`)
    }

    this.logger.info(colors.green(`\n✅ Total: ${ufs.length} UFs suportadas`))

    // Testar alguns endpoints aleatórios
    this.logger.info(colors.yellow('\n🧪 Exemplos de endpoints:'))

    const samples = ['SP', 'RJ', 'MG']
    for (const uf of samples) {
      const endpoints = FiscalRoutingService.resolveEndpoints(uf, false)
      this.logger.info(`   ${uf}: ${endpoints.autorizacao.substring(0, 50)}...`)
    }

    this.logger.info(
      colors.dim('\n💡 Use "node ace fiscal:test-routing <UF>" para ver detalhes de uma UF')
    )
  }
}
