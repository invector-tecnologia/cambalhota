import { BaseCommand, args } from '@adonisjs/core/ace'
import FiscalRoutingService from '#services/fiscal_routing_service'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Comando para testar roteamento fiscal por UF
 * Uso: node ace fiscal:test-routing <UF>
 */
export default class TestFiscalRouting extends BaseCommand {
  static commandName = 'fiscal:test-routing'
  static description = 'Testa o roteamento de endpoints SEFAZ para uma UF específica'

  static options: CommandOptions = {
    startApp: false,
  }

  @args.string({ description: 'Sigla da UF (ex: SP, RJ, MG)' })
  declare uf: string

  async run() {
    const uf = this.uf.toUpperCase()

    this.logger.info(`🔍 Testando roteamento fiscal para UF: ${uf}`)

    // Valida formato
    if (!FiscalRoutingService.isValidUFFormat(uf)) {
      this.logger.error(`❌ Formato de UF inválido: ${uf}`)
      this.logger.info('   Formato esperado: 2 letras (ex: SP, RJ, MG)')
      return
    }

    // Valida suporte
    if (!FiscalRoutingService.supportsNFCe(uf)) {
      this.logger.error(`❌ UF ${uf} não é suportada para NFC-e`)
      return
    }

    this.logger.success(`✅ UF ${uf} é suportada`)

    // Obtém autorizador
    const autorizador = FiscalRoutingService.getAutorizador(uf)
    this.logger.info(`📡 Autorizador: ${autorizador}`)

    // Endpoints de homologação
    this.logger.info('\n🧪 Endpoints de HOMOLOGAÇÃO:')
    const endpointsHomolog = FiscalRoutingService.resolveEndpoints(uf, true)
    this.logger.info(`   Autorização: ${endpointsHomolog.autorizacao}`)
    this.logger.info(`   Consulta: ${endpointsHomolog.consultaProtocolo}`)
    this.logger.info(`   Evento: ${endpointsHomolog.recepcaoEvento}`)
    this.logger.info(`   Inutilização: ${endpointsHomolog.inutilizacao}`)

    // Endpoints de produção
    this.logger.info('\n🚀 Endpoints de PRODUÇÃO:')
    const endpointsProducao = FiscalRoutingService.resolveEndpoints(uf, false)
    this.logger.info(`   Autorização: ${endpointsProducao.autorizacao}`)
    this.logger.info(`   Consulta: ${endpointsProducao.consultaProtocolo}`)
    this.logger.info(`   Evento: ${endpointsProducao.recepcaoEvento}`)
    this.logger.info(`   Inutilização: ${endpointsProducao.inutilizacao}`)

    // Contingência
    this.logger.info('\n🔥 Endpoints de CONTINGÊNCIA (SVCAN):')
    const contingency = FiscalRoutingService.getContingencyEndpoints(true)
    this.logger.info(`   Autorização: ${contingency.autorizacao}`)

    this.logger.success(`\n✅ Roteamento para ${uf} configurado corretamente!`)
  }
}
