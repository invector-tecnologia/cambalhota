import Pedido from '#models/pedido'
import Insumo from '#models/insumo'
import InsumoReserva from '#models/insumo_reserva'
import CardapioProduto from '#models/cardapio_produto'
import { DateTime } from 'luxon'

export class InsumoStockService {
  /**
   * Reserva insumos quando um pedido é criado
   * @param pedido - O pedido que está sendo criado
   * @throws Error se não houver insumos suficientes disponíveis
   */
  async reserveInsumoFromOrder(pedido: Pedido): Promise<void> {
    try {
      // Carregar itens do pedido com os produtos
      await pedido.load('items', (query) => {
        query.preload('cardapioProduto')
      })

      // Para cada item do pedido
      for (const item of pedido.items) {
        // Carregar ingredientes do produto
        await item.cardapioProduto.load('ingredientes')

        // Para cada ingrediente do produto
        for (const ingrediente of item.cardapioProduto.ingredientes) {
          // Calcular quantidade a reservar
          const quantityToReserve = ingrediente.quantity * item.quantity

          // Buscar o insumo
          const insumo = await Insumo.findOrFail(ingrediente.insumoId)

          // Validar se há estoque suficiente (considerando reservas existentes)
          const availableStock = await this.getAvailableStock(insumo.id)

          if (availableStock < quantityToReserve) {
            throw new Error(
              `Estoque insuficiente do insumo "${insumo.name}". ` +
                `Disponível: ${availableStock.toFixed(3)}, Necessário: ${quantityToReserve.toFixed(3)}`
            )
          }

          // Criar registro de reserva
          await InsumoReserva.create({
            empresaId: pedido.empresaId,
            insumoId: insumo.id,
            pedidoId: pedido.id,
            pedidoItemId: item.id,
            quantidade: quantityToReserve,
            unidade: ingrediente.unit,
            status: 'reserved',
            reservedAt: DateTime.now(),
          })
        }
      }
    } catch (error) {
      throw new Error(`Erro ao reservar insumos do pedido ${pedido.id}: ${error.message}`)
    }
  }

  /**
   * Desconta os insumos do almoxarifado quando um pedido ENTRA EM PREPARO (preparing)
   * Converte as reservas de "reserved" para "deducted"
   * IMPORTANTE: Este método é idempotente - só debita reservas com status "reserved"
   * @param pedido - O pedido que entrou em preparo
   * @throws Error se houver erro ao descontar insumos
   */
  async deductInsumoFromOrder(pedido: Pedido): Promise<void> {
    try {
      // Buscar todas as reservas do pedido que ainda estão como "reserved"
      const reservas = await InsumoReserva.query()
        .where('pedido_id', pedido.id)
        .where('status', 'reserved')

      if (reservas.length === 0) {
        return // Sem reservas para descontar
      }

      // Para cada reserva
      for (const reserva of reservas) {
        // Buscar o insumo
        const insumo = await Insumo.findOrFail(reserva.insumoId)

        // Descontar efetivamente do estoque
        insumo.currentStock -= reserva.quantidade
        await insumo.save()

        // Marcar a reserva como deducted
        await reserva.markAsDeducted()
      }
    } catch (error) {
      throw new Error(`Erro ao descontar insumos do pedido ${pedido.id}: ${error.message}`)
    }
  }

  /**
   * Libera as reservas de insumos quando um pedido é cancelado
   * Só libera reservas com status "reserved" (antes do débito)
   * @param pedido - O pedido que está sendo cancelado
   */
  async releaseInsumoReservation(pedido: Pedido): Promise<void> {
    try {
      // Buscar todas as reservas do pedido que ainda estão como "reserved"
      const reservas = await InsumoReserva.query()
        .where('pedido_id', pedido.id)
        .where('status', 'reserved')

      // Marcar todas como released
      for (const reserva of reservas) {
        await reserva.release()
      }
    } catch (error) {
      throw new Error(`Erro ao liberar reservas do pedido ${pedido.id}: ${error.message}`)
    }
  }

  /**
   * Libera as reservas de insumos de um item específico quando é cancelado
   * Só libera reservas com status "reserved" (antes do débito)
   * @param pedidoItemId - O ID do item que está sendo cancelado
   */
  async releaseInsumoReservationForItem(pedidoItemId: number): Promise<void> {
    try {
      // Buscar todas as reservas do item que ainda estão como "reserved"
      const reservas = await InsumoReserva.query()
        .where('pedido_item_id', pedidoItemId)
        .where('status', 'reserved')

      // Marcar todas como released
      for (const reserva of reservas) {
        await reserva.release()
      }
    } catch (error) {
      throw new Error(`Erro ao liberar reservas do item ${pedidoItemId}: ${error.message}`)
    }
  }

  /**
   * Obtém o estoque disponível de um insumo (currentStock - reservas ativas)
   * @param insumoId - ID do insumo
   * @returns Quantidade disponível
   */
  async getAvailableStock(insumoId: number): Promise<number> {
    const insumo = await Insumo.findOrFail(insumoId)

    // Somar todas as quantidades reservadas que ainda não foram deducidas
    const reservedQuantity = await InsumoReserva.query()
      .where('insumo_id', insumoId)
      .whereIn('status', ['reserved'])
      .sum('quantidade as total')

    const totalReserved = (reservedQuantity[0] as any)?.sum || 0
    return insumo.currentStock - totalReserved
  }

  /**
   * Verifica se há insumos suficientes para preparar um produto
   * @param cardapioProdutoId - ID do produto no cardápio
   * @param quantidade - Quantidade do produto a preparar
   * @returns Objeto com informação de disponibilidade
   */
  async checkProductAvailability(
    cardapioProdutoId: number,
    quantidade: number = 1
  ): Promise<{
    available: boolean
    missingInsumos: Array<{ name: string; available: number; needed: number }>
  }> {
    const produto = await CardapioProduto.findOrFail(cardapioProdutoId)
    await produto.load('ingredientes')

    const missingInsumosList: Array<{ name: string; available: number; needed: number }> = []

    // Para cada ingrediente do produto
    for (const ingrediente of produto.ingredientes) {
      const quantityNeeded = ingrediente.quantity * quantidade
      const availableStock = await this.getAvailableStock(ingrediente.insumoId)

      if (availableStock < quantityNeeded) {
        const insumo = await Insumo.findOrFail(ingrediente.insumoId)
        missingInsumosList.push({
          name: insumo.name,
          available: availableStock,
          needed: quantityNeeded,
        })
      }
    }

    return {
      available: missingInsumosList.length === 0,
      missingInsumos: missingInsumosList,
    }
  }

  /**
   * Calcula a quantidade máxima possível de preparar um produto
   * @param cardapioProdutoId - ID do produto no cardápio
   * @returns Quantidade máxima que pode ser preparada
   */
  async getMaxPossibleQuantity(cardapioProdutoId: number): Promise<number> {
    const produto = await CardapioProduto.findOrFail(cardapioProdutoId)
    await produto.load('ingredientes')

    if (produto.ingredientes.length === 0) {
      return 999 // Produto sem ingredientes, sem limite
    }

    let maxQuantity = Infinity

    // Para cada ingrediente, calcular quantas unidades do produto podem ser feitas
    for (const ingrediente of produto.ingredientes) {
      const availableStock = await this.getAvailableStock(ingrediente.insumoId)
      const possibleQuantity = Math.floor(availableStock / ingrediente.quantity)
      maxQuantity = Math.min(maxQuantity, possibleQuantity)
    }

    return maxQuantity === Infinity ? 0 : maxQuantity
  }

  /**
   * Verifica se há insumos suficientes para preparar um pedido completo
   * @param pedido - O pedido a verificar
   * @returns Objeto com informação de disponibilidade e detalhes
   */
  async checkOrderAvailability(pedido: Pedido): Promise<{
    available: boolean
    missingInsumos: Array<{ name: string; available: number; needed: number }>
  }> {
    await pedido.load('items', (query) => {
      query.preload('cardapioProduto')
    })

    const insumoMap = new Map<number, { name: string; available: number; needed: number }>()

    // Para cada item do pedido
    for (const item of pedido.items) {
      await item.cardapioProduto.load('ingredientes')

      // Para cada ingrediente do produto
      for (const ingrediente of item.cardapioProduto.ingredientes) {
        const quantityNeeded = ingrediente.quantity * item.quantity
        const availableStock = await this.getAvailableStock(ingrediente.insumoId)

        if (availableStock < quantityNeeded) {
          const insumo = await Insumo.findOrFail(ingrediente.insumoId)

          if (!insumoMap.has(insumo.id)) {
            insumoMap.set(insumo.id, {
              name: insumo.name,
              available: availableStock,
              needed: quantityNeeded,
            })
          } else {
            const existing = insumoMap.get(insumo.id)!
            existing.needed += quantityNeeded
          }
        }
      }
    }

    return {
      available: insumoMap.size === 0,
      missingInsumos: Array.from(insumoMap.values()),
    }
  }
}

export default new InsumoStockService()
