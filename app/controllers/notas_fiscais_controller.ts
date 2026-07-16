import type { HttpContext } from '@adonisjs/core/http'
import Nfe from '#models/nfe'
import NfeProcessorService from '#services/nfe_processor_service'
import vine from '@vinejs/vine'
import { extractCount } from '#helpers/db_agg'
import cloudLogger from '#services/cloud_logger'

export default class NotasFiscaisController {
  /**
   * Lista todas as NFes
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', '')
    const dateFrom = request.input('date_from', '')
    const dateTo = request.input('date_to', '')

    let query = Nfe.query()
      .where('empresa_id', user.empresaId)
      .preload('fornecedor')
      .preload('processedByUser')

    if (search) {
      query = query.where((builder) => {
        builder
          .where('number', 'ilike', `%${search}%`)
          .orWhere('accessKey', 'ilike', `%${search}%`)
          .orWhereHas('fornecedor', (supplierQuery) => {
            supplierQuery.where('name', 'ilike', `%${search}%`)
          })
      })
    }

    if (status) {
      query = query.where('status', status)
    }

    if (dateFrom) {
      query = query.where('issueDate', '>=', dateFrom)
    }

    if (dateTo) {
      query = query.where('issueDate', '<=', dateTo)
    }

    const nfes = await query.orderBy('issueDate', 'desc').paginate(page, 15)

    return view.render('almoxarifado/notas_fiscais/index', {
      nfes: nfes.serialize(),
      filters: { search, status, dateFrom, dateTo },
    })
  }

  /**
   * Página de importação
   */
  async create({ view }: HttpContext) {
    // const user = await auth.authenticate()
    return view.render('almoxarifado/notas_fiscais/create')
  }

  /**
   * Processa upload e importação da NFe
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const uploadSchema = vine.object({
      xml_file: vine.file({
        size: '2mb',
        extnames: ['xml'],
      }),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: uploadSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.preload('empresa')

      // Ler conteúdo do arquivo XML
      const xmlFile = data.xml_file
      await xmlFile.move('/tmp')
      const fs = await import('node:fs')
      const xmlContent = fs.readFileSync(xmlFile.filePath!, 'utf-8')

      // Verificar se NFe já existe
      const xmlData = await NfeProcessorService.parseXml(xmlContent)
      const existingNfe = await Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('accessKey', xmlData.accessKey)
        .first()

      if (existingNfe) {
        session.flash('error', 'Esta NFe já foi importada anteriormente')
        return response.redirect().back()
      }

      // Processar NFe
      const nfe = await NfeProcessorService.processNfe(xmlContent, user.empresaId, user.id)

      logger.info(
        `[NOTAS_FISCAIS STORE] SUCCESS | NFe ID: ${nfe.id} | Number: ${nfe.number} | AccessKey: ${nfe.accessKey} | User: ${user.id}`
      )
      cloudLogger.info('NFE_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        nfeId: nfe.id,
        nfeNumber: nfe.number,
        accessKey: nfe.accessKey,
      })

      session.flash('success', `NFe ${nfe.number} importada com sucesso!`)
      return response.redirect().toRoute('notas_fiscais.show', { id: nfe.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(`[STORE NFE] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
      cloudLogger.error('NFE_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', `Erro ao importar NFe: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Exibe detalhes da NFe
   */
  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()

    const nfe = await Nfe.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .preload('fornecedor')
      .preload('processedByUser')
      .preload('items', (query) => {
        query.preload('insumo')
      })
      .firstOrFail()

    return view.render('almoxarifado/notas_fiscais/show', { nfe })
  }

  /**
   * Aplica entrada no estoque
   */
  async applyStockEntry({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()

      logger.info(
        `[NOTAS_FISCAIS APPLY_STOCK] User ${user.id} applying stock entry for NFe ${params.id}`
      )

      const nfe = await Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      if (nfe.status !== 'processed') {
        session.flash('error', 'NFe deve estar processada para aplicar entrada no estoque')
        return response.redirect().back()
      }

      if (nfe.entryDate) {
        session.flash('error', 'Entrada no estoque já foi aplicada para esta NFe')
        return response.redirect().back()
      }

      // Aplicar entrada no estoque
      await NfeProcessorService.applyStockEntry(nfe.id)

      logger.info(
        `[NOTAS_FISCAIS APPLY_STOCK] SUCCESS | NFe ${nfe.id} stock entry applied by user ${user.id}`
      )
      session.flash('success', 'Entrada no estoque aplicada com sucesso!')
      return response.redirect().toRoute('notas_fiscais.show', { id: nfe.id })
    } catch (error) {
      logger.error(`[NOTAS_FISCAIS APPLY_STOCK] ERROR | NFe ${params.id} | Error: ${error.message}`)
      session.flash('error', `Erro ao aplicar entrada no estoque: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Remove a NFe (soft delete)
   */
  async destroy({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')

      logger.info(`[NOTAS_FISCAIS DESTROY] User ${user.id} attempting to delete NFe ${params.id}`)

      const nfe = await Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      if (nfe.entryDate) {
        session.flash('error', 'Não é possível remover uma NFe que já teve entrada no estoque')
        return response.redirect().back()
      }

      // Marcar como erro (soft delete)
      await nfe.markAsError('Removida pelo usuário')

      logger.info(
        `[NOTAS_FISCAIS DESTROY] SUCCESS | NFe ${nfe.id} marked as error by user ${user.id}`
      )
      cloudLogger.info('NFE_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        nfeId: nfe.id,
        nfeNumber: nfe.number,
      })

      session.flash('success', 'NFe removida com sucesso!')
      return response.redirect().toRoute('notas_fiscais.index')
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(`[NOTAS_FISCAIS DESTROY] ERROR | NFe ${params.id} | Error: ${error.message}`)
      cloudLogger.error('NFE_DELETE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao remover NFe')
      return response.redirect().back()
    }
  }

  /**
   * Reprocessar NFe com erro
   */
  async reprocess({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()

      logger.info(`[NOTAS_FISCAIS REPROCESS] User ${user.id} reprocessing NFe ${params.id}`)

      const nfe = await Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .where('status', 'error')
        .firstOrFail()

      if (!nfe.xmlContent) {
        session.flash('error', 'XML não está disponível para reprocessamento')
        return response.redirect().back()
      }

      // Reprocessar
      await nfe.markAsProcessing(user.id)
      const reprocessedNfe = await NfeProcessorService.processNfe(
        nfe.xmlContent,
        user.empresaId,
        user.id
      )

      logger.info(
        `[NOTAS_FISCAIS REPROCESS] SUCCESS | Original NFe ${params.id} reprocessed as ${reprocessedNfe.id} by user ${user.id}`
      )
      session.flash('success', 'NFe reprocessada com sucesso!')
      return response.redirect().toRoute('notas_fiscais.show', { id: reprocessedNfe.id })
    } catch (error) {
      logger.error(`[NOTAS_FISCAIS REPROCESS] ERROR | NFe ${params.id} | Error: ${error.message}`)
      await Nfe.findOrFail(params.id).then((nfe) => nfe.markAsError(error.message))
      session.flash('error', `Erro ao reprocessar NFe: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * API: Dados para dashboard
   */
  async stats({ response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    logger.info(`[NOTAS_FISCAIS STATS] User ${user.id} requesting NFe stats`)

    const [total, processed, pending, withStockEntry] = await Promise.all([
      Nfe.query().where('empresa_id', user.empresaId).count('* as total'),
      Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('status', 'processed')
        .count('* as total'),
      Nfe.query()
        .where('empresa_id', user.empresaId)
        .where('status', 'pending')
        .count('* as total'),
      Nfe.query().where('empresa_id', user.empresaId).whereNotNull('entryDate').count('* as total'),
    ])

    const stats = {
      total: extractCount(total),
      processed: extractCount(processed),
      pending: extractCount(pending),
      withStockEntry: extractCount(withStockEntry),
    }

    return response.json(stats)
  }
}
