import FiscalConfig from '#models/fiscal_config'
import FiscalNote from '#models/fiscal_note'
import FiscalTransformer from './fiscal_transformer.js'
import FiscalTransmitter from './fiscal_transmitter.js'
import FiscalRoutingService from './fiscal_routing_service.js'
import FiscalEmissionWorkflow from './fiscal_emission_workflow.js'
import { formatDateTimeForSEFAZ } from '#helpers/fiscal_formatters'
import logger from '@adonisjs/core/services/logger'
import cloudLogger from '#services/cloud_logger'
import type Venda from '#models/venda'

/**
 * Serviço centralizado para orquestração de operações fiscais
 * Coordena Transformer, Signer e Transmitter
 */
export default class FiscalService {
  /**
   * Inicia o processo de emissão de NFC-e para uma venda
   * Fluxo: Criar FiscalNote → Transformer → Signer → Transmitter
   */
  static async emitNFCe(
    venda: Venda,
    establishmentId: number,
    options?: { customerCpf?: string }
  ): Promise<FiscalNote> {
    const workflow = new FiscalEmissionWorkflow()
    return await workflow.emit(venda, establishmentId, options)
  }

  /**
   * Consulta o status de uma NFC-e já emitida
   */
  static async queryNFCeStatus(fiscalNoteId: string): Promise<any> {
    try {
      const fiscalNote = await FiscalNote.findOrFail(fiscalNoteId)
      const fiscalConfig = await fiscalNote.related('fiscalConfig').query().firstOrFail()

      logger.info(
        {
          fiscalNoteId,
          status: fiscalNote.status,
          hasAccessKey: !!fiscalNote.accessKey,
          hasProtocol: !!fiscalNote.protocolNumber,
        },
        '[FISCAL_SERVICE] QUERY_STATUS_CHECK'
      )

      // Verifica status da nota antes de consultar
      if (fiscalNote.status === 'PENDING') {
        throw new Error(
          'NFC-e ainda está sendo processada. Status: PENDENTE. Aguarde a conclusão do processamento.'
        )
      }

      if (fiscalNote.status === 'ERROR') {
        throw new Error(
          'NFC-e teve erro no processamento. Status: ERRO. Verifique os logs para mais detalhes.'
        )
      }

      if (!fiscalNote.accessKey) {
        throw new Error(
          `NFC-e não possui chave de acesso. Status atual: ${fiscalNote.status}. ` +
            `A nota precisa estar AUTORIZADA (status: AUTHORIZED) para consulta.`
        )
      }

      // Obtém UF da nota fiscal para consulta no SEFAZ correto
      const uf = fiscalNote.uf || (await fiscalConfig.getEffectiveState())
      const endpoints = FiscalRoutingService.resolveEndpoints(uf, fiscalConfig.isHomologation)
      const environmentName = fiscalConfig.isHomologation ? 'Homologação' : 'Produção'

      logger.info(
        {
          fiscalNoteId,
          uf,
          environment: environmentName,
          sefazUrl: endpoints.retAutorizacao,
          accessKey: fiscalNote.accessKey,
        },
        '[FISCAL_SERVICE] QUERY_STATUS_START'
      )

      const transmitter = new FiscalTransmitter({
        homologation: fiscalConfig.isHomologation,
        state: uf,
        certificatePath: fiscalConfig.certificatePath,
        certificatePassword: fiscalConfig.getDecryptedCertificatePassword(),
      })

      const statusResult = await transmitter.queryNFCeStatus(fiscalNote.accessKey)

      logger.info(
        {
          fiscalNoteId,
          uf,
          sefazStatus: statusResult?.status,
          environment: environmentName,
        },
        '[FISCAL_SERVICE] QUERY_STATUS_SUCCESS'
      )

      return statusResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.warn({ error: errorMessage, fiscalNoteId }, '[FISCAL_SERVICE] QUERY_STATUS_FAILED')
      throw error
    }
  }

  /**
   * Cancela uma NFC-e já autorizada
   */
  static async cancelNFCe(fiscalNoteId: string, justification: string): Promise<void> {
    try {
      const fiscalNote = await FiscalNote.findOrFail(fiscalNoteId)
      const fiscalConfig = await fiscalNote.related('fiscalConfig').query().firstOrFail()

      const trimmedJustification = justification.trim()
      if (trimmedJustification.length < 15 || trimmedJustification.length > 255) {
        throw new Error('Justificativa deve ter entre 15 e 255 caracteres')
      }

      if (fiscalNote.status !== 'AUTHORIZED') {
        throw new Error('Apenas notas autorizadas podem ser canceladas')
      }

      if (!fiscalNote.accessKey) {
        throw new Error('NFC-e não possui chave de acesso')
      }

      if (!fiscalNote.protocolNumber) {
        throw new Error('NFC-e não possui protocolo de autorização')
      }

      // Obtém UF da nota fiscal para cancelamento no SEFAZ correto
      const uf = fiscalNote.uf || (await fiscalConfig.getEffectiveState())
      const endpoints = FiscalRoutingService.resolveEndpoints(uf, fiscalConfig.isHomologation)
      const environmentName = fiscalConfig.isHomologation ? 'Homologação' : 'Produção'

      logger.info(
        {
          fiscalNoteId,
          uf,
          environment: environmentName,
          sefazUrl: endpoints.inutilizacao,
          accessKey: fiscalNote.accessKey,
        },
        '[FISCAL_SERVICE] CANCEL_START'
      )

      const transmitter = new FiscalTransmitter({
        homologation: fiscalConfig.isHomologation,
        state: uf,
        certificatePath: fiscalConfig.certificatePath,
        certificatePassword: fiscalConfig.getDecryptedCertificatePassword(),
      })

      await fiscalNote.load('venda', (vendaQuery) => {
        vendaQuery.preload('empresa')
      })
      const venda = fiscalNote.venda
      const cnpj = venda?.empresa?.cnpj
      if (!cnpj) {
        throw new Error('CNPJ do emitente não encontrado para cancelamento')
      }

      const cancellationResult = await transmitter.cancelNFCe(
        fiscalNote.accessKey,
        fiscalNote.protocolNumber,
        trimmedJustification,
        cnpj
      )

      if (cancellationResult.error) {
        logger.warn(
          {
            error: cancellationResult.error,
            fiscalNoteId,
            uf,
            environment: environmentName,
          },
          '[FISCAL_SERVICE] CANCEL_FAILED'
        )
        throw new Error(`Erro ao cancelar: ${cancellationResult.error}`)
      }

      fiscalNote.status = 'CANCELLED'
      await fiscalNote.save()
      logger.info(
        {
          fiscalNoteId,
          uf,
          environment: environmentName,
        },
        '[FISCAL_SERVICE] CANCEL_SUCCESS'
      )
      cloudLogger.info('FISCAL_CANCEL_SUCCESS', {
        fiscalNoteId,
        accessKey: fiscalNote.accessKey,
        justification,
        cnpj,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.warn({ error: errorMessage, fiscalNoteId }, 'FISCAL_CANCEL_EXCEPTION')
      const fiscalNote = await FiscalNote.findOrFail(fiscalNoteId)
      await fiscalNote.load('venda', (vendaQuery) => {
        vendaQuery.preload('empresa')
      })
      cloudLogger.error('FISCAL_CANCEL_EXCEPTION', {
        fiscalNoteId,
        error: errorMessage,
        cnpj: fiscalNote.venda?.empresa?.cnpj,
      })
      throw error
    }
  }

  /**
   * Modo de contingência: se SEFAZ estiver fora, emite offline
   */
  static async emitNFCeContingency(venda: Venda, establishmentId: number): Promise<FiscalNote> {
    try {
      logger.warn({ vendaId: venda.id, establishmentId }, 'FISCAL_CONTINGENCY_START')

      await venda.load('empresa')

      const fiscalConfig = await FiscalConfig.findByOrFail('establishment_id', establishmentId)
      const uf = await fiscalConfig.getEffectiveState()
      const nfeNumber = await FiscalConfig.incrementNextNfeNumber(establishmentId)

      const fiscalNote = new FiscalNote()
      fiscalNote.vendaId = venda.id
      fiscalNote.fiscalConfigId = fiscalConfig.id
      fiscalNote.status = 'CONTINGENCY'
      fiscalNote.uf = uf
      fiscalNote.numero = nfeNumber
      fiscalNote.serie = fiscalConfig.serie || 1
      await fiscalNote.save()

      // Gera XML mas não transmite
      const xmlContent = await FiscalTransformer.transformToXml(
        venda,
        venda.empresa,
        fiscalConfig,
        undefined,
        {
          nfeNumber,
          tpEmis: 9,
          dhCont: formatDateTimeForSEFAZ(new Date(), uf),
          xJust: 'SEFAZ indisponivel - emissao em contingencia',
        }
      )

      fiscalNote.xmlContent = xmlContent
      await fiscalNote.save()

      // Uma tarefa BullMQ seria agendada aqui para retransmissão posterior
      logger.info({ fiscalNoteId: fiscalNote.id }, 'FISCAL_CONTINGENCY_EMITTED')

      return fiscalNote
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.warn({ error: errorMessage }, 'FISCAL_CONTINGENCY_FAILED')
      throw error
    }
  }

  /**
   * Emite NFC-e a partir de uma venda
   */
  static async emitNFCeFromVenda(params: {
    empresaId: number
    vendaId: number
    customerCpf?: string
  }): Promise<{
    success: boolean
    nfce?: FiscalNote
    error?: string
  }> {
    try {
      const vendaModule = await import('#models/venda')
      const Venda = vendaModule.default

      logger.info(
        {
          vendaId: params.vendaId,
          empresaId: params.empresaId,
          environment: process.env.NODE_ENV,
        },
        '[FISCAL_SERVICE] Iniciando emissão de NFC-e da venda'
      )

      const venda = await Venda.query()
        .where('id', params.vendaId)
        .where('empresa_id', params.empresaId)
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('cardapioProduto')
        })
        .preload('empresa')
        .firstOrFail()

      logger.info(
        {
          vendaId: params.vendaId,
          itemsCount: venda.items.length,
        },
        '[FISCAL_SERVICE] Venda carregada, prosseguindo com emissão'
      )

      const nfce = await this.emitNFCe(venda, params.empresaId, {
        customerCpf: params.customerCpf,
      })
      return { success: true, nfce }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error(
        {
          error: errorMessage,
          vendaId: params.vendaId,
          environment: process.env.NODE_ENV,
        },
        '[FISCAL_SERVICE] Erro ao emitir NFC-e da venda'
      )
      cloudLogger.error('FISCAL_VENDA_EMIT_FAILED', {
        vendaId: params.vendaId,
        error: errorMessage,
        environment: process.env.NODE_ENV,
      })
      return { success: false, error: errorMessage }
    }
  }
}
