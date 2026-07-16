import cloudLogger from '#services/cloud_logger'
import Venda from '#models/venda'

interface CloseAndPayParams {
  comanda: any
  user: any
  paymentMethod: string
  discountPercentage: number
  cpf?: string
  emitNfce: boolean
  timezone: string
  logger: any
}

interface CloseAndPayResult {
  venda: Venda
  emitPromise?: Promise<any>
  fiscal_note?: any
  fiscal_note_error?: string
}

export default class ComandaCloseService {
  static async closeAndPay(params: CloseAndPayParams): Promise<CloseAndPayResult> {
    const { comanda, user, paymentMethod, discountPercentage, cpf, emitNfce, timezone, logger } =
      params

    logger.info(
      `[COMANDAS CLOSE_AND_PAY] Iniciando criacao de venda | Comanda: ${comanda.id} | PaymentMethod: ${paymentMethod} | Discount: ${discountPercentage}%`
    )

    const venda = await Venda.createFromComanda(
      comanda,
      paymentMethod,
      user.id,
      discountPercentage,
      timezone
    )

    if (!emitNfce) {
      return { venda }
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '') || undefined

    // Executa emissão de forma assíncrona mas registra o resultado
    const emitPromise = this.emitNFCeAsync({
      empresaId: user.empresaId,
      vendaId: venda.id,
      customerCpf: cleanCpf,
      logger,
    })

    // Para não quebrar o fluxo, retorna a promise para que o cliente possa aguardar se quiser
    // Mas também tenta fazer sincronamente com timeout curto para dar feedback imediato
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error('ASYNC_EMIT_TIMEOUT')), 5000) // 5 segundos
      )

      const result = await Promise.race([emitPromise, timeoutPromise])
      logger.info(`[COMANDAS CLOSE_AND_PAY] NF-e emitida com sucesso para venda ${venda.id}`)
      return { venda, fiscal_note: result }
    } catch (timeoutError) {
      // Se timeout, continua em background mas avisa ao usuário
      if (timeoutError instanceof Error && timeoutError.message === 'ASYNC_EMIT_TIMEOUT') {
        logger.warn(
          `[COMANDAS CLOSE_AND_PAY] Emissao de NF-e em andamento (timeout de resposta rapida). Venda: ${venda.id}`
        )
        cloudLogger.warn('FISCAL_EMIT_ASYNC_TIMEOUT', {
          vendaId: venda.id,
          message: 'Emissão continuará em background',
        })

        // Retorna venda com aviso de que emissão será concluída em background
        return {
          venda,
          emitPromise,
          fiscal_note_error: 'Emissão em progresso, verifique status da nota em breve',
        }
      }

      // Outros erros
      logger.error(`[COMANDAS CLOSE_AND_PAY] Erro na emissao da NF-e: ${timeoutError}`)
      cloudLogger.error('FISCAL_EMIT_FAILED_SYNC', {
        vendaId: venda.id,
        error: timeoutError instanceof Error ? timeoutError.message : String(timeoutError),
      })

      return {
        venda,
        emitPromise,
        fiscal_note_error: 'Erro ao emitir NF-e, será retentado em background',
      }
    }
  }

  /**
   * Emite NF-e de forma assíncrona com melhor tratamento de erro
   */
  private static async emitNFCeAsync(params: {
    empresaId: number
    vendaId: number
    customerCpf?: string
    logger: any
  }): Promise<any> {
    try {
      const { empresaId, vendaId, customerCpf, logger } = params

      const fiscalModule = await import('#services/fiscal_service')
      const FiscalService = fiscalModule.default

      logger.info(`[FISCAL_EMIT_ASYNC_START] Iniciando emissão para venda ${vendaId}`)

      const result = await FiscalService.emitNFCeFromVenda({
        empresaId,
        vendaId,
        customerCpf,
      })

      if (result.success) {
        logger.info(`[FISCAL_EMIT_ASYNC_SUCCESS] NF-e emitida com sucesso para venda ${vendaId}`)
        cloudLogger.info('FISCAL_EMIT_ASYNC_SUCCESS', {
          vendaId,
          nfceId: result.nfce?.id,
          accessKey: result.nfce?.accessKey,
        })
        return result.nfce
      } else {
        logger.error(`[FISCAL_EMIT_ASYNC_FAILED] Erro na emissao da NF-e: ${result.error}`)
        cloudLogger.error('FISCAL_EMIT_ASYNC_FAILED', {
          vendaId,
          error: result.error,
        })
        throw new Error(result.error || 'Erro desconhecido na emissão')
      }
    } catch (nfError) {
      const errorMsg = nfError instanceof Error ? nfError.message : String(nfError)
      params.logger.error(`[FISCAL_EMIT_ASYNC_EXCEPTION] Exceção ao emitir NF-e: ${errorMsg}`)
      cloudLogger.error('FISCAL_EMIT_ASYNC_EXCEPTION', {
        vendaId: params.vendaId,
        error: errorMsg,
        stack: nfError instanceof Error ? nfError.stack : undefined,
      })
      throw nfError
    }
  }
}
