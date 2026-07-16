import Venda from '#models/venda'
import Pedido from '#models/pedido'
import { DateTime } from 'luxon'

/**
 * Handlers de processamento para Vendas
 */
export class VendaProcessingHandlers {
  /**
   * Aplica desconto à venda
   */
  static async applyDiscount(venda: Venda) {
    try {
      if (!venda.discount || venda.discount <= 0) {
        return {
          success: true,
          data: { message: 'Nenhum desconto a aplicar', discountApplied: 0 },
        }
      }

      // Recalcular total com desconto
      const subtotal = venda.subtotal
      const newTotal = subtotal - venda.discount
      venda.total = Math.max(newTotal, 0) // Garantir que não seja negativo

      await venda.save()

      return {
        success: true,
        data: {
          message: 'Desconto aplicado com sucesso',
          vendaId: venda.id,
          discountApplied: venda.discount,
          newTotal: venda.total,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao aplicar desconto',
      }
    }
  }

  /**
   * Aplica taxa de serviço
   */
  static async applyServiceCharge(venda: Venda) {
    try {
      // Se venda tem um pedido associado, aplicar taxa do pedido
      if (venda.pedidoId) {
        const pedido = await Pedido.find(venda.pedidoId)
        if (pedido && pedido.serviceCharge > 0) {
          const newTotal = venda.total + pedido.serviceCharge
          venda.total = newTotal

          await venda.save()

          return {
            success: true,
            data: {
              message: 'Taxa de serviço aplicada com sucesso',
              vendaId: venda.id,
              serviceCharge: pedido.serviceCharge,
              newTotal: venda.total,
            },
          }
        }
      }

      return {
        success: true,
        data: { message: 'Nenhuma taxa de serviço a aplicar' },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao aplicar taxa de serviço',
      }
    }
  }

  /**
   * Calcula e atualiza margem de lucro
   */
  static async calculateProfit(venda: Venda) {
    try {
      const profit = venda.total - venda.costTotal
      const profitMargin = venda.costTotal > 0 ? (profit / venda.costTotal) * 100 : 0

      venda.profit = profit
      venda.profitMargin = profitMargin

      await venda.save()

      return {
        success: true,
        data: {
          message: 'Lucro calculado com sucesso',
          vendaId: venda.id,
          profit,
          profitMargin,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular lucro',
      }
    }
  }

  /**
   * Vincula venda ao pedido se necessário
   */
  static async linkToPedido(venda: Venda) {
    try {
      if (venda.pedidoId) {
        const pedido = await Pedido.find(venda.pedidoId)
        if (!pedido) {
          return {
            success: false,
            error: 'Pedido não encontrado',
          }
        }

        // Verificar se pedido está em status correto
        if (pedido.status !== 'served' && pedido.status !== 'ready') {
          return {
            success: false,
            error: `Pedido deve estar pronto ou servido, mas está em status: ${pedido.status}`,
          }
        }

        // Marcar pedido como pago se venda é para pagamento
        if (!pedido.paidAt) {
          pedido.status = 'paid'
          pedido.paidAt = DateTime.now()
          await pedido.save()
        }
      }

      return {
        success: true,
        data: {
          message: 'Venda vinculada ao pedido com sucesso',
          vendaId: venda.id,
          pedidoId: venda.pedidoId,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao vincular venda ao pedido',
      }
    }
  }
}
