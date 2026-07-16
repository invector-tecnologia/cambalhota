import Comanda from '#models/comanda'

/**
 * Handlers de processamento para Comandas
 */
export class ComandaProcessingHandlers {
  /**
   * Verifica e fecha comanda quando todos os pedidos são pagos
   */
  static async checkAndCloseIfCompleted(comanda: Comanda) {
    try {
      await comanda.checkAndCloseIfCompleted()

      return {
        success: true,
        data: {
          message: 'Status da comanda verificado e atualizado',
          comandaId: comanda.id,
          active: comanda.active,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar status da comanda',
      }
    }
  }

  /**
   * Garante que comanda está ativa
   */
  static async ensureActive(comanda: Comanda) {
    try {
      if (!comanda.active) {
        comanda.active = true
        await comanda.save()
      }

      return {
        success: true,
        data: {
          message: 'Comanda ativada',
          comandaId: comanda.id,
          active: comanda.active,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ativar comanda',
      }
    }
  }

  /**
   * Calcula totais da comanda com base em seus pedidos
   */
  static async recalculateTotals(comanda: Comanda) {
    try {
      await comanda.load('pedidos')

      let totalSubtotal = 0
      let totalDiscount = 0
      let totalServiceCharge = 0

      for (const pedido of comanda.pedidos) {
        totalSubtotal += pedido.subtotal || 0
        totalDiscount += pedido.discount || 0
        totalServiceCharge += pedido.serviceCharge || 0
      }

      return {
        success: true,
        data: {
          message: 'Totais da comanda calculados',
          comandaId: comanda.id,
          totalSubtotal,
          totalDiscount,
          totalServiceCharge,
          totalAmount: totalSubtotal - totalDiscount + totalServiceCharge,
          pedidosCount: comanda.pedidos.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular totais da comanda',
      }
    }
  }
}
