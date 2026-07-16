import type { HttpContext } from '@adonisjs/core/http'
import Venda from '#models/venda'
import Empresa from '#models/empresa'
import vine from '@vinejs/vine'
import QRCodeNFCeGenerator from '#services/qrcode_nfce_generator'
import FiscalXmlParser from '#services/fiscal_xml_parser'

export default class VendasFiscalController {
  /**
   * Retorna status da NF-e da venda (polling leve via AJAX)
   */
  async fiscalNoteStatus({ params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const venda = await Venda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!venda) {
      return response.status(404).json({ success: false, message: 'Venda não encontrada' })
    }

    const fiscalNoteModule = await import('#models/fiscal_note')
    const FiscalNote = fiscalNoteModule.default
    const fiscalNote = await FiscalNote.query()
      .where('venda_id', venda.id)
      .orderBy('created_at', 'desc')
      .first()

    return response.json({
      success: true,
      fiscalNote: fiscalNote
        ? {
            id: fiscalNote.id,
            status: fiscalNote.status,
            accessKey: fiscalNote.accessKey,
            updatedAt: fiscalNote.updatedAt,
          }
        : null,
    })
  }

  /**
   * Imprimir NF-e (DANFE simplificado) da venda, quando existir
   */
  async printNfe({ view, params, response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    logger.info(`[VENDAS PRINT NFE] User ${user.id} printing NF-e for venda ${params.id}`)

    const venda = await Venda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('pedido')
      .first()

    if (!venda) {
      return response.notFound('Venda não encontrada')
    }

    const fiscalNoteModule = await import('#models/fiscal_note')
    const FiscalNote = fiscalNoteModule.default
    let fiscalNote = null as any

    fiscalNote = await FiscalNote.query()
      .where('venda_id', venda.id)
      .orderBy('created_at', 'desc')
      .first()
    logger.info(
      `[VENDAS PRINT NFE] Busca por venda_id: ${venda.id} - ${fiscalNote ? 'encontrada' : 'não encontrada'}`
    )

    if (!fiscalNote) {
      logger.warn(`[VENDAS PRINT NFE] NF-e não encontrada para venda ${venda.id}`)
      return response.notFound('NF-e não encontrada para esta venda')
    }

    const empresa = await Empresa.findOrFail(user.empresaId)
    const empresaSerialized = {
      ...empresa.serialize(),
      formattedDocument: empresa.formattedDocument,
    }

    const fiscalConfigModule = await import('#models/fiscal_config')
    const FiscalConfig = fiscalConfigModule.default
    const fiscalConfig = await FiscalConfig.findByOrFail('establishment_id', user.empresaId)
    const tpAmb = fiscalConfig.isHomologation ? 2 : 1

    let nfeData: any = {}
    let qrCodeUrl = ''

    if (fiscalNote.xmlContent) {
      try {
        const parsed = FiscalXmlParser.parseForPrint(fiscalNote.xmlContent)
        nfeData = {
          dest: parsed.dest,
          emit: parsed.emit,
          items: parsed.items,
          total: parsed.total,
          totalsRaw: parsed.totalsRaw,
        }

        const accessKey = parsed.qrPayload.accessKey || fiscalNote.accessKey || ''
        const qrTpAmb = parsed.qrPayload.tpAmb || tpAmb
        const dhEmi = parsed.qrPayload.dhEmi
        const vNF = parsed.qrPayload.vNF
        const digVal = parsed.qrPayload.digVal
        const cpfCnpjDest = parsed.dest?.CNPJ || parsed.dest?.CPF

        if (accessKey && dhEmi && vNF !== undefined && digVal) {
          qrCodeUrl = QRCodeNFCeGenerator.generate(
            accessKey,
            qrTpAmb,
            dhEmi,
            vNF,
            digVal,
            empresa,
            fiscalConfig,
            cpfCnpjDest
          )
        } else if (accessKey) {
          const urlBase = QRCodeNFCeGenerator.getConsultaUrl(empresa.state, qrTpAmb)
          qrCodeUrl = `${urlBase}?chNFe=${accessKey}`
          logger.warn('[VENDAS PRINT NFE] Dados incompletos para QR completo; usando urlChave')
        } else {
          logger.warn('[VENDAS PRINT NFE] Chave de acesso ausente; QRCode não gerado')
        }
      } catch (e) {
        logger.error(`[VENDAS PRINT NFE] Erro ao processar XML NF-e: ${String(e)}`)
      }
    }

    return view.render('vendas/nfe_print', {
      venda: venda.serialize(),
      empresa: empresaSerialized,
      nfce: fiscalNote.serialize(),
      qrCodeUrl,
      nfeData,
    })
  }

  /**
   * Emitir NFC-e para uma venda já existente
   */
  async emitNfce({ params, request, response, session, auth, logger }: HttpContext) {
    try {
      console.log(`[SERVER EMIT_NFCE] ==== INICIO ==== Venda: ${params.id}`)
      const user = await auth.authenticate()
      console.log(`[SERVER EMIT_NFCE] User autenticado: ${user.id}`)

      logger.info(`[EMIT_NFCE] Requisição recebida para venda: ${params.id}`)
      console.log(`[SERVER EMIT_NFCE] User: ${user.id}`)

      const venda = await Venda.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .preload('items', (query) => {
          query.preload('cardapioProduto')
        })
        .preload('comanda', (query) => {
          query.preload('pedidos', (q) => {
            q.preload('items', (i) => {
              i.preload('cardapioProduto')
            })
          })
        })
        .first()

      if (!venda) {
        logger.error(`[EMIT_NFCE] Venda não encontrada: ${params.id}`)
        return response.notFound({ error: 'Venda não encontrada' })
      }

      logger.info(`[EMIT_NFCE] Venda carregada: ${venda.id}, items: ${venda.items.length}`)

      const fiscalNoteModule = await import('#models/fiscal_note')
      const FiscalNote = fiscalNoteModule.default
      const latestFiscalNote = await FiscalNote.query()
        .where('venda_id', venda.id)
        .orderBy('created_at', 'desc')
        .first()

      if (latestFiscalNote && latestFiscalNote.status !== 'ERROR') {
        session.flash(
          'error',
          `NF-e já emitida ou em processamento. Status atual: ${latestFiscalNote.status}.`
        )
        return response.redirect().toRoute('vendas.show', { id: venda.id })
      }

      const { cpf } = await request.validateUsing(
        vine.compile(
          vine.object({
            cpf: vine.string().optional(),
          })
        )
      )

      logger.info(`[EMIT_NFCE] CPF fornecido: ${cpf ? 'Sim' : 'Não'}`)

      const fiscalServiceModule = await import('#services/fiscal_service')
      const FiscalService = fiscalServiceModule.default
      const cleanCpf = (cpf || '').replace(/\D/g, '') || undefined

      logger.info(`[EMIT_NFCE] Iniciando emissão para venda ${venda.id}, usuário ${user.id}`)

      const result = await FiscalService.emitNFCeFromVenda({
        empresaId: user.empresaId,
        vendaId: venda.id,
        customerCpf: cleanCpf,
      })

      if (result.success) {
        logger.info(`[EMIT_NFCE] Sucesso! Chave: ${result.nfce?.accessKey}`)
        session.flash('success', `NF-e emitida com sucesso! Chave: ${result.nfce?.accessKey}`)
        return response.redirect().toRoute('vendas.show', { id: venda.id })
      }

      logger.error(`[EMIT_NFCE] Falha: ${result.error}`)
      const errorMsg = result.error?.toLowerCase() || ''
      if (errorMsg.includes('dados fiscais') || errorMsg.includes('não cadastrado')) {
        session.flash(
          'error',
          `Produtos com dados fiscais incompletos. ${result.error}. Acesse Cardápio > Produtos para completar os dados.`
        )
      } else {
        session.flash('error', `Falha ao emitir NF-e: ${result.error}`)
      }
      return response.redirect().toRoute('vendas.show', { id: venda.id })
    } catch (error: any) {
      const message = error?.message || String(error)
      logger.error(`[EMIT_NFCE] Exceção: ${message}`)
      if (
        message.toLowerCase().includes('dados fiscais') ||
        message.toLowerCase().includes('não cadastrado')
      ) {
        session.flash(
          'error',
          `Produtos com dados fiscais incompletos: ${message}. Acesse Cardápio > Produtos para completar os dados.`
        )
      } else {
        session.flash('error', `Erro ao emitir NF-e: ${message}`)
      }
      return response.redirect().toRoute('vendas.show', { id: params.id })
    }
  }
}
