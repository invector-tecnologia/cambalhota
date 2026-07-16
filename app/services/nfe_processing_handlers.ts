import Nfe from '#models/nfe'
import NfeProcessorService from '#services/nfe_processor_service'

/**
 * Handlers de processamento para Notas Fiscais
 */
export class NfeProcessingHandlers {
  /**
   * Processa a NFe (já está implementado, mas adaptado para o handler)
   */
  static async processNfe(nfe: Nfe, config: Record<string, any> = {}) {
    try {
      if (!nfe.xmlContent) {
        return {
          success: false,
          error: 'Conteúdo XML não disponível para processamento',
        }
      }

      // Se já foi processada, retornar sucesso
      if (nfe.status === 'processed') {
        return {
          success: true,
          data: {
            message: 'NFe já foi processada',
            nfeId: nfe.id,
            status: nfe.status,
          },
        }
      }

      // Processar a NFe
      const result = await NfeProcessorService.processNfe(
        nfe.xmlContent,
        nfe.empresaId,
        config.userId || null
      )

      return {
        success: true,
        data: {
          message: 'NFe processada com sucesso',
          nfeId: result.id,
          status: result.status,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar NFe',
      }
    }
  }

  /**
   * Aplica entrada em estoque baseada em NFe
   */
  static async applyStockEntry(nfe: Nfe) {
    try {
      if (nfe.status !== 'processed') {
        return {
          success: false,
          error: 'NFe deve estar processada para aplicar entrada em estoque',
        }
      }

      if (nfe.entryDate) {
        return {
          success: true,
          data: {
            message: 'Entrada em estoque já foi aplicada',
            nfeId: nfe.id,
            entryDate: nfe.entryDate,
          },
        }
      }

      // Aplicar entrada
      await NfeProcessorService.applyStockEntry(nfe.id)

      return {
        success: true,
        data: {
          message: 'Entrada em estoque aplicada com sucesso',
          nfeId: nfe.id,
          entryDate: new Date(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao aplicar entrada em estoque',
      }
    }
  }

  /**
   * Valida integridade da NFe
   */
  static async validateIntegrity(nfe: Nfe) {
    try {
      let issues: string[] = []

      // Verificações
      if (!nfe.xmlContent) {
        issues.push('XML não disponível')
      }

      if (!nfe.accessKey) {
        issues.push('Chave de acesso ausente')
      }

      if (!nfe.number) {
        issues.push('Número da NFe ausente')
      }

      if (nfe.totalValue <= 0) {
        issues.push('Valor total inválido')
      }

      // Verificar se já existe duplicada
      if (nfe.id) {
        const duplicate = await Nfe.query()
          .where('empresa_id', nfe.empresaId)
          .where('access_key', nfe.accessKey)
          .where('id', '!=', nfe.id)
          .first()

        if (duplicate) {
          issues.push(`Duplicata encontrada: NFe ID ${duplicate.id}`)
        }
      }

      if (issues.length > 0) {
        return {
          success: false,
          error: `Problemas de integridade: ${issues.join('; ')}`,
        }
      }

      return {
        success: true,
        data: {
          message: 'NFe validada com sucesso',
          nfeId: nfe.id,
          issues: [],
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao validar NFe',
      }
    }
  }
}
