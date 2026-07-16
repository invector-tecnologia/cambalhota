import { HttpContext } from '@adonisjs/core/http'
import FiscalService from '#services/fiscal_service'
import FiscalRoutingService from '#services/fiscal_routing_service'
import FiscalConfig from '#models/fiscal_config'
import FiscalNote from '#models/fiscal_note'
import Venda from '#models/venda'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'

/**
 * Controller para gerenciamento de operações fiscais
 * Endpoints para emissão, consulta, cancelamento e exportação de notas
 */
export default class FiscalController {
  /**
   * GET /fiscal/notes/:id - Detalhes de uma nota fiscal
   */
  async showNote({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      return response.json({
        success: true,
        data: {
          id: fiscalNote.id,
          status: fiscalNote.status,
          uf: fiscalNote.uf,
          numero: fiscalNote.numero,
          serie: fiscalNote.serie,
          access_key: fiscalNote.accessKey,
          protocol_number: fiscalNote.protocolNumber,
          danfe_url: fiscalNote.danfeUrl,
          created_at: fiscalNote.createdAt,
          updated_at: fiscalNote.updatedAt,
          error_log: fiscalNote.errorLog,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(404).json({ success: false, message: errorMessage })
    }
  }
  /**
   * POST /fiscal/emit - Emite uma nova NFC-e para uma venda
   * Caso de uso UC21: Emissão automática após fechamento da venda
   */
  async emit({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const { venda_id: vendaId } = request.only(['venda_id'])

      // Valida entrada
      if (!vendaId) {
        return response.status(422).json({ error: 'venda_id é obrigatório' })
      }

      // Obtém a venda
      const venda = await Venda.query()
        .where('id', vendaId)
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('cardapioProduto')
        })
        .preload('empresa')
        .firstOrFail()

      // Obtém o establishment_id do usuário/empresa
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      // Verifica se há configuração fiscal ativa
      const fiscalConfig = await FiscalConfig.query()
        .where('establishment_id', establishmentId)
        .first()

      if (!fiscalConfig) {
        return response.status(400).json({
          error: 'Configuração fiscal não encontrada para este estabelecimento',
        })
      }

      // Calcular total da venda
      const totalVenda = venda.items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0)

      cloudLogger.info('Iniciando emissão de NFC-e', {
        vendaId: venda.id,
        establishmentId,
        total: totalVenda,
        itemsCount: venda.items.length,
        cnpj: venda.empresa?.cnpj,
      })

      const fiscalNote = await FiscalService.emitNFCe(venda, establishmentId)

      cloudLogger.info('NFC-e emitida com sucesso', {
        vendaId: venda.id,
        noteId: fiscalNote.id,
        accessKey: fiscalNote.accessKey,
        uf: fiscalNote.uf,
        cnpj: venda.empresa?.cnpj,
      })

      return response.json({
        success: true,
        fiscal_note: fiscalNote,
        message: 'NFC-e emitida com sucesso',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao emitir NFC-e')

      const vendaId = request.input('venda_id')
      let cnpj = null
      try {
        const venda = await Venda.query().where('id', vendaId).preload('empresa').first()
        if (venda) {
          cnpj = venda.empresa?.cnpj
        }
      } catch {}

      cloudLogger.error('Erro ao emitir NFC-e', {
        vendaId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        cnpj,
      })

      return response.status(500).json({
        error: 'Erro ao emitir NFC-e',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/notes - Lista notas fiscais com filtros avançados
   * Filtros: período, status, valor
   */
  async listNotes({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      // Parâmetros de filtro
      const startDate = request.input('start_date')
      const endDate = request.input('end_date')
      const status = request.input('status')
      const uf = request.input('uf')
      const minValue = request.input('min_value')
      const maxValue = request.input('max_value')
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Constrói query base
      let query = FiscalNote.query().whereHas('fiscalConfig', (configQuery) => {
        configQuery.where('establishment_id', establishmentId)
      })

      // Filtro por período
      if (startDate) {
        query = query.whereRaw('DATE(fiscal_notes.created_at) >= ?', [startDate])
      }
      if (endDate) {
        query = query.whereRaw('DATE(fiscal_notes.created_at) <= ?', [endDate])
      }

      // Filtro por status
      if (status) {
        query = query.where('status', status)
      }

      // Filtro por UF
      if (uf) {
        query = query.where('uf', uf.toUpperCase())
      }

      // Filtro por valor (se tiver coluna de valor na nota, ajustar conforme necessário)
      if (minValue) {
        query = query.where('value', '>=', minValue)
      }
      if (maxValue) {
        query = query.where('value', '<=', maxValue)
      }

      // Paginação
      const notes = await query.paginate(page, limit)

      return response.json({
        success: true,
        data: notes,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao listar notas fiscais')

      return response.status(500).json({
        error: 'Erro ao listar notas fiscais',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/danfe/:id - Download do PDF da DANFE
   */
  async getDanfe({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      if (!fiscalNote.danfeUrl) {
        return response.status(404).json({
          error: 'DANFE não disponível para esta nota',
        })
      }

      // Aqui você teria a lógica para gerar ou recuperar o PDF DANFE
      // Por enquanto, retornar URL
      return response.json({
        success: true,
        danfe_url: fiscalNote.danfeUrl,
        access_key: fiscalNote.accessKey,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao recuperar DANFE')

      return response.status(500).json({
        error: 'Erro ao recuperar DANFE',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/xml/:id - Download do XML da nota
   */
  async getXml({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      if (!fiscalNote.xmlContent) {
        return response.status(404).json({
          error: 'XML não disponível para esta nota',
        })
      }

      response.type('application/xml')
      response.attachment(`nfe_${fiscalNote.accessKey}.xml`)
      response.send(fiscalNote.xmlContent)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao recuperar XML')

      return response.status(500).json({
        error: 'Erro ao recuperar XML',
        message: errorMessage,
      })
    }
  }

  /**
   * POST /fiscal/cancel/:id - Cancela uma NFC-e autorizada
   */
  async cancel({ params, request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params
      const { justification } = request.only(['justification'])

      if (!justification) {
        return response.status(422).json({
          error: 'Justificativa de cancelamento é obrigatória',
        })
      }

      const trimmedJustification = justification.trim()
      if (trimmedJustification.length < 15 || trimmedJustification.length > 255) {
        return response.status(422).json({
          error: 'Justificativa deve ter entre 15 e 255 caracteres',
        })
      }

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      if (fiscalNote.status !== 'AUTHORIZED') {
        return response.status(400).json({
          error: 'Apenas notas autorizadas podem ser canceladas',
          current_status: fiscalNote.status,
        })
      }

      await FiscalService.cancelNFCe(id, trimmedJustification)

      return response.json({
        success: true,
        message: 'NFC-e cancelada com sucesso',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao cancelar NFC-e')

      return response.status(500).json({
        error: 'Erro ao cancelar NFC-e',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/status/:id - Consulta status de uma NFC-e na SEFAZ
   */
  async queryStatus({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      // Verifica se a nota pode ser consultada no SEFAZ
      if (fiscalNote.status === 'PENDING') {
        return response.status(400).json({
          success: false,
          error: 'NOTA_PENDENTE',
          message: 'NFC-e ainda está sendo processada. Aguarde alguns instantes e tente novamente.',
          current_status: fiscalNote.status,
        })
      }

      if (fiscalNote.status === 'ERROR') {
        return response.status(400).json({
          success: false,
          error: 'NOTA_COM_ERRO',
          message: 'NFC-e teve erro no processamento. Não é possível consultar no SEFAZ.',
          current_status: fiscalNote.status,
        })
      }

      if (!fiscalNote.accessKey) {
        return response.status(400).json({
          success: false,
          error: 'DADOS_INCOMPLETOS',
          message: `NFC-e não possui chave de acesso. Status: ${fiscalNote.status}`,
          current_status: fiscalNote.status,
        })
      }

      const statusResult = await FiscalService.queryNFCeStatus(id)

      return response.json({
        success: true,
        current_status: fiscalNote.status,
        sefaz_status: statusResult,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage, fiscalNoteId: params.id }, 'Erro ao consultar status')

      return response.status(500).json({
        success: false,
        error: 'ERRO_CONSULTA',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/export-accounting - Exporta notas em arquivo ZIP para contabilidade
   * Caso de uso UC23: Painel do Contador
   */
  async exportAccounting({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const month = request.input('month')
      const year = request.input('year')

      if (!month || !year) {
        return response.status(422).json({
          error: 'Mês e ano são obrigatórios',
        })
      }

      // Busca todas as notas autorizadas do período
      const notes = await FiscalNote.query()
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .where('status', 'AUTHORIZED')
        .whereRaw('EXTRACT(MONTH FROM fiscal_notes.created_at) = ?', [month])
        .whereRaw('EXTRACT(YEAR FROM fiscal_notes.created_at) = ?', [year])

      if (notes.length === 0) {
        return response.status(404).json({
          error: 'Nenhuma nota encontrada para o período informado',
        })
      }

      // Aqui você faria a compressão dos XMLs em um arquivo ZIP
      // Usando biblioteca como 'adm-zip' ou 'archiver'

      return response.json({
        success: true,
        message: `${notes.length} notas fiscais exportadas`,
        notes: notes.map((n) => ({
          id: n.id,
          access_key: n.accessKey,
          protocol_number: n.protocolNumber,
          created_at: n.createdAt,
        })),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao exportar dados contábeis')

      return response.status(500).json({
        error: 'Erro ao exportar dados contábeis',
        message: errorMessage,
      })
    }
  }

  /**
   * POST /fiscal/config - Configura parâmetros fiscais do estabelecimento
   */
  async configureEstablishment({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const {
        certificate_path: certificatePath,
        certificate_password: certificatePassword,
        csc_token: cscToken,
        csc_id: cscId,
        is_homologation: isHomologation,
      } = request.only([
        'certificate_path',
        'certificate_password',
        'csc_token',
        'csc_id',
        'is_homologation',
      ])

      // Valida entrada
      if (!certificatePath || !certificatePassword || !cscToken || !cscId) {
        return response.status(422).json({
          error: 'Todos os campos de configuração são obrigatórios',
        })
      }

      // Tenta encontrar ou criar configuração
      let config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

      if (!config) {
        config = new FiscalConfig()
        config.establishmentId = establishmentId
      }

      config.certificatePath = certificatePath
      config.certificatePassword = certificatePassword
      config.cscToken = cscToken
      config.cscId = cscId
      config.isHomologation = isHomologation !== false

      await config.save()

      return response.json({
        success: true,
        message: 'Configuração fiscal salva com sucesso',
        config,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao configurar estabelecimento')

      return response.status(500).json({
        error: 'Erro ao configurar estabelecimento',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/config - Obtém configuração fiscal do estabelecimento (API)
   */
  async getConfig({ response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

      if (!config) {
        return response.status(404).json({
          error: 'Configuração fiscal não encontrada',
        })
      }

      // Não retorna senha do certificado
      return response.json({
        success: true,
        config: {
          id: config.id,
          establishment_id: config.establishmentId,
          certificate_path: config.certificatePath,
          csc_id: config.cscId,
          is_homologation: config.isHomologation,
          next_nfe_number: config.nextNfeNumber,
          created_at: config.createdAt,
          updated_at: config.updatedAt,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao obter configuração')

      return response.status(500).json({
        error: 'Erro ao obter configuração',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/export-accounting.zip - Baixa ZIP com XMLs autorizados do período
   */
  async exportAccountingZip({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const month = Number(request.input('month'))
      const year = Number(request.input('year'))

      if (!month || !year) {
        return response.status(422).json({ error: 'Mês e ano são obrigatórios' })
      }

      const notes = await FiscalNote.query()
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .where('status', 'AUTHORIZED')
        .whereRaw('EXTRACT(MONTH FROM fiscal_notes.created_at) = ?', [month])
        .whereRaw('EXTRACT(YEAR FROM fiscal_notes.created_at) = ?', [year])

      if (notes.length === 0) {
        return response.status(404).json({ error: 'Nenhuma nota encontrada para o período' })
      }

      const archiver = await import('archiver')
      response.header('Content-Type', 'application/zip')
      response.header(
        'Content-Disposition',
        `attachment; filename="nfce_${String(year)}_${String(month).padStart(2, '0')}.zip"`
      )

      const archive = archiver.default('zip', { zlib: { level: 9 } })
      archive.on('error', (err: any) => {
        throw err
      })
      archive.pipe(response.response)

      for (const n of notes) {
        if (!n.xmlContent) continue
        const fileName = `nfe_${n.accessKey || n.id}.xml`
        archive.append(n.xmlContent, { name: fileName })
      }

      await archive.finalize()
      return
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({ error: 'Erro ao gerar ZIP', message: errorMessage })
    }
  }

  /**
   * GET /fiscal/supported-states - Lista todas as UFs suportadas para NFC-e
   */
  async getSupportedStates({ response }: HttpContext) {
    try {
      const ufs = FiscalRoutingService.getSupportedUFs()

      const statesInfo = ufs.map((uf) => ({
        code: uf,
        autorizador: FiscalRoutingService.getAutorizador(uf),
        supports_nfce: true,
      }))

      return response.json({
        success: true,
        data: {
          total: statesInfo.length,
          states: statesInfo,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({
        error: 'Erro ao listar estados',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/routing-info/:uf - Obtém informações de roteamento para uma UF
   */
  async getRoutingInfo({ params, response }: HttpContext) {
    try {
      const { uf } = params

      if (!uf || !FiscalRoutingService.isValidUFFormat(uf)) {
        return response.status(422).json({
          error: 'UF inválida',
          message: 'Formato de UF deve ser 2 letras (ex: SP, RJ, MG)',
        })
      }

      if (!FiscalRoutingService.supportsNFCe(uf)) {
        return response.status(404).json({
          error: 'UF não suportada',
          message: `A UF ${uf.toUpperCase()} não está habilitada para emissão de NFC-e`,
        })
      }

      const autorizador = FiscalRoutingService.getAutorizador(uf)
      const endpointsHomolog = FiscalRoutingService.resolveEndpoints(uf, true)
      const endpointsProducao = FiscalRoutingService.resolveEndpoints(uf, false)

      return response.json({
        success: true,
        data: {
          uf: uf.toUpperCase(),
          autorizador,
          endpoints: {
            homologacao: endpointsHomolog,
            producao: endpointsProducao,
          },
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({
        error: 'Erro ao obter informações de roteamento',
        message: errorMessage,
      })
    }
  }

  /**
   * POST /fiscal/notes/:id/retry - Reprocessa uma nota fiscal com erro
   */
  async retryEmissionNote({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId
      const { id } = params

      const fiscalNote = await FiscalNote.query()
        .where('id', id)
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .firstOrFail()

      if (fiscalNote.status === 'AUTHORIZED') {
        return response.status(422).json({
          error: 'Nota já autorizada',
          message: 'Notas autorizadas não podem ser reprocessadas',
        })
      }

      if (!fiscalNote.isRetryable) {
        return response.status(422).json({
          error: 'Nota não elegível para retry',
          message: 'Esta nota ultrapassou o limite de tentativas (5)',
        })
      }

      logger.info(
        { fiscalNoteId: id, establishmentId },
        '[FISCAL_CONTROLLER] Iniciando retry manual'
      )
      cloudLogger.info('FISCAL_RETRY_INITIATED', {
        fiscalNoteId: id,
        establishmentId,
        userId: (user as any).id,
      })

      const fiscalReprocessingModule = await import('#services/fiscal_reprocessing_service')
      const FiscalReprocessingService = fiscalReprocessingModule.default

      const success = await FiscalReprocessingService.reprocessNote(id)

      if (success) {
        return response.json({
          success: true,
          message: 'Nota reprocessada com sucesso',
        })
      } else {
        return response.status(422).json({
          success: false,
          message: 'Falha ao reprocessar nota. Verifique o status.',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao fazer retry de nota')
      return response.status(500).json({
        error: 'Erro ao fazer retry',
        message: errorMessage,
      })
    }
  }

  /**
   * GET /fiscal/pending-notes - Lista notas pendentes/com erro elegíveis para reprocessamento
   */
  async listPendingNotes({ response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const notes = await FiscalNote.query()
        .whereHas('fiscalConfig', (configQuery) => {
          configQuery.where('establishment_id', establishmentId)
        })
        .where((query) => {
          query.where('status', 'PENDING').orWhere((q) => {
            q.where('status', 'ERROR').where('is_retryable', true)
          })
        })
        .select([
          'id',
          'venda_id',
          'status',
          'access_key',
          'numero',
          'serie',
          'uf',
          'attempt_count',
          'last_attempt_at',
          'last_attempt_error',
          'is_retryable',
          'created_at',
          'updated_at',
        ])

      return response.json({
        success: true,
        data: {
          total: notes.length,
          notes: notes.map((n) => ({
            id: n.id,
            venda_id: n.vendaId,
            status: n.status,
            access_key: n.accessKey,
            numero: n.numero,
            serie: n.serie,
            uf: n.uf,
            attempt_count: n.attemptCount,
            last_attempt_at: n.lastAttemptAt,
            last_attempt_error: n.lastAttemptError,
            is_retryable: n.isRetryable,
            created_at: n.createdAt,
            updated_at: n.updatedAt,
          })),
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return response.status(500).json({
        error: 'Erro ao listar notas pendentes',
        message: errorMessage,
      })
    }
  }
}
