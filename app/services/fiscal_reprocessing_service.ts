import FiscalNote from '#models/fiscal_note'
import Venda from '#models/venda'
import FiscalService from './fiscal_service.js'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'
import { DateTime } from 'luxon'

export default class FiscalReprocessingService {
  /**
   * Reprocessa todas as notas fiscais pendentes ou com erro
   * que ainda são elegíveis para retry
   */
  static async reprocessPendingNotes(): Promise<{
    processed: number
    successful: number
    failed: number
    errors: Array<{ noteId: string; error: string }>
  }> {
    const errors: Array<{ noteId: string; error: string }> = []
    let processed = 0
    let successful = 0
    let failed = 0

    try {
      // Busca notas que estão em andamento há mais de 2 minutos (timeout presumido)
      // ou que têm erro mas ainda são retentáveis
      const twoMinutesAgo = DateTime.now().minus({ minutes: 2 })
      const pendingNotes = await FiscalNote.query()
        .where((query) => {
          query
            .where('status', 'PENDING')
            .where('updated_at', '<', twoMinutesAgo.toSQL())
            .orWhere((q) => {
              q.where('status', 'ERROR').where('is_retryable', true).where('attempt_count', '<', 5)
            })
        })
        .limit(100) // Processa até 100 por vez

      logger.info(
        { count: pendingNotes.length },
        '[FISCAL_REPROCESSING] Iniciando reprocessamento de notas'
      )
      cloudLogger.info('FISCAL_REPROCESSING_START', { count: pendingNotes.length })

      for (const note of pendingNotes) {
        processed++
        try {
          // Carrega a venda associada
          const venda = await Venda.find(note.vendaId)
          if (!venda) {
            const error = `Venda ${note.vendaId} não encontrada`
            errors.push({ noteId: note.id, error })
            await note.markAsError({ reason: 'venda_not_found' })
            failed++
            continue
          }

          logger.info(
            { fiscalNoteId: note.id, vendaId: venda.id, status: note.status },
            '[FISCAL_REPROCESSING] Reprocessando nota'
          )

          // Tenta emitir novamente
          await venda.load('items', (q) => q.preload('cardapioProduto'))
          await venda.load('empresa')

          const result = await FiscalService.emitNFCe(venda, venda.empresaId)

          // Atualiza o resultado
          if (result.status === 'AUTHORIZED') {
            successful++
            logger.info(
              { fiscalNoteId: note.id, accessKey: result.accessKey },
              '[FISCAL_REPROCESSING] Nota reprocessada com sucesso'
            )
            cloudLogger.info('FISCAL_REPROCESSING_SUCCESS', {
              fiscalNoteId: note.id,
              vendaId: venda.id,
              accessKey: result.accessKey,
            })
          } else {
            failed++
            errors.push({
              noteId: note.id,
              error: `Status: ${result.status}, Error: ${result.errorLog?.error || 'unknown'}`,
            })
            logger.warn(
              { fiscalNoteId: note.id, status: result.status },
              '[FISCAL_REPROCESSING] Nota falhou no reprocessamento'
            )
          }
        } catch (error) {
          failed++
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push({ noteId: note.id, error: errorMsg })

          logger.error(
            { fiscalNoteId: note.id, error: errorMsg },
            '[FISCAL_REPROCESSING] Exceção ao reprocessar nota'
          )

          // Marca a nota com o erro
          try {
            await note.markAsError({
              reason: 'reprocessing_failed',
              error: errorMsg,
              timestamp: DateTime.now().toISO(),
            })
          } catch (updateError) {
            logger.error({ fiscalNoteId: note.id }, '[FISCAL_REPROCESSING] Erro ao marcar falha')
          }
        }
      }

      const result = { processed, successful, failed, errors }
      logger.info(result, '[FISCAL_REPROCESSING] Conclusão')
      cloudLogger.info('FISCAL_REPROCESSING_COMPLETE', result)

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMsg }, '[FISCAL_REPROCESSING] Erro fatal')
      cloudLogger.error('FISCAL_REPROCESSING_FATAL_ERROR', { error: errorMsg })
      throw error
    }
  }

  /**
   * Reprocessa uma nota fiscal específica
   */
  static async reprocessNote(fiscalNoteId: string): Promise<boolean> {
    try {
      const note = await FiscalNote.findOrFail(fiscalNoteId)
      const venda = await Venda.find(note.vendaId)

      if (!venda) {
        await note.markAsError({ reason: 'venda_not_found' })
        throw new Error(`Venda ${note.vendaId} não encontrada`)
      }

      logger.info(
        { fiscalNoteId: note.id, vendaId: venda.id },
        '[FISCAL_REPROCESSING] Reprocessando nota individual'
      )

      await venda.load('items', (q) => q.preload('cardapioProduto'))
      await venda.load('empresa')

      const result = await FiscalService.emitNFCe(venda, venda.empresaId)

      if (result.status === 'AUTHORIZED') {
        logger.info(
          { fiscalNoteId: note.id, accessKey: result.accessKey },
          '[FISCAL_REPROCESSING] Nota individual reprocessada com sucesso'
        )
        cloudLogger.info('FISCAL_REPROCESSING_INDIVIDUAL_SUCCESS', {
          fiscalNoteId: note.id,
          accessKey: result.accessKey,
        })
        return true
      } else {
        logger.warn(
          { fiscalNoteId: note.id, status: result.status },
          '[FISCAL_REPROCESSING] Nota individual falhou'
        )
        return false
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(
        { fiscalNoteId, error: errorMsg },
        '[FISCAL_REPROCESSING] Erro ao reprocessar individual'
      )
      throw error
    }
  }

  /**
   * Lista notas pendentes/com erro elegíveis para retry
   */
  static async listPendingNotes() {
    return await FiscalNote.query()
      .where((query) => {
        query.where('status', 'PENDING').orWhere((q) => {
          q.where('status', 'ERROR').where('is_retryable', true)
        })
      })
      .orderBy('updated_at', 'asc')
  }
}
