import Pedido from '#models/pedido'
import { InsumoStockService } from '#services/insumo_stock_service'

/**
 * Handlers de processamento para Pedidos
 */
export class PedidoProcessingHandlers {
  /**
   * Reserva insumos quando um pedido é criado
   */
  static async reserveInsumos(pedido: Pedido) {
    try {
      const service = new InsumoStockService()
      await service.reserveInsumoFromOrder(pedido)

      return {
        success: true,
        data: {
          message: 'Insumos reservados com sucesso',
          pedidoId: pedido.id,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reservar insumos',
      }
    }
  }

  /**
   * Deduz insumos do estoque quando um pedido fica pronto
   */
  static async deductInsumos(pedido: Pedido) {
    try {
      const service = new InsumoStockService()
      await service.deductInsumoFromOrder(pedido)

      return {
        success: true,
        data: {
          message: 'Insumos deducidos com sucesso',
          pedidoId: pedido.id,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deduzir insumos',
      }
    }
  }

  /**
   * Libera reservas de insumos quando um pedido é cancelado
   */
  static async releaseInsumos(pedido: Pedido) {
    try {
      const service = new InsumoStockService()
      await service.releaseInsumoReservation(pedido)

      return {
        success: true,
        data: {
          message: 'Reservas de insumos liberadas com sucesso',
          pedidoId: pedido.id,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao liberar reservas',
      }
    }
  }

  /**
   * Sincroniza status da comanda quando todos os pedidos são pagos
   */
  static async syncComandaStatus(pedido: Pedido) {
    try {
      if (!pedido.comandaId) {
        return {
          success: true,
          data: { message: 'Pedido não tem comanda associada' },
        }
      }

      const comandaModule = await import('#models/comanda')
      const Comanda = comandaModule.default
      const comanda = await Comanda.find(pedido.comandaId)

      if (!comanda) {
        return {
          success: false,
          error: 'Comanda não encontrada',
        }
      }

      await comanda.checkAndCloseIfCompleted()

      return {
        success: true,
        data: {
          message: 'Status da comanda sincronizado',
          comandaId: comanda.id,
          comandaActive: comanda.active,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar status da comanda',
      }
    }
  }
}
