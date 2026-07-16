import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import FiscalReprocessingService from '#services/fiscal_reprocessing_service'

export default class FiscalReprocessPending extends BaseCommand {
  static commandName = 'fiscal:reprocess-pending'
  static description = 'Reprocessa notas fiscais pendentes ou com erro'
  static options: CommandOptions = {
    startSubcommand: true,
  }

  async handle() {
    this.logger.info('Iniciando reprocessamento de notas fiscais pendentes...')

    try {
      const result = await FiscalReprocessingService.reprocessPendingNotes()

      this.logger.info(`
Resultado do reprocessamento:
  - Total processado: ${result.processed}
  - Sucesso: ${result.successful}
  - Falhou: ${result.failed}
`)

      if (result.errors.length > 0) {
        this.logger.error('Erros encontrados:')
        result.errors.forEach((err) => {
          this.logger.error(`  - ${err.noteId}: ${err.error}`)
        })
      }

      this.exitCode = result.failed > 0 ? 1 : 0
    } catch (error) {
      this.logger.error('Erro ao reprocessar notas:')
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}
