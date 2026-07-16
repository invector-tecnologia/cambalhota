import Pedido from '#models/pedido'
import PedidoItem from '#models/pedido_item'
import insumoStockService from '#services/insumo_stock_service'

interface PedidoCreateData {
  comandaId?: number
  waiterId?: number
  type: 'dine_in' | 'takeout' | 'delivery'
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  notes?: string
  discount?: number
  serviceCharge?: number
  items: Array<{
    cardapioProductId: number
    quantity: number
    specialInstructions?: string
  }>
}

interface PedidoUpdateData {
  comandaId?: number | null
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  notes?: string
  discount?: number
  serviceCharge?: number
  itemsJson?: string
}

export default class PedidoService {
  static async createPedido(
    data: PedidoCreateData,
    user: any,
    logger: any,
    timezone?: string
  ): Promise<Pedido> {
    const availability = await Promise.all(
      data.items.map((item) =>
        insumoStockService.checkProductAvailability(item.cardapioProductId, item.quantity)
      )
    )

    const unavailableProducts = availability.filter((a) => !a.available)
    if (unavailableProducts.length > 0) {
      const missingDetails = unavailableProducts
        .flatMap((a) => a.missingInsumos)
        .map(
          (m) =>
            `${m.name} (disponivel: ${m.available.toFixed(3)}, necessario: ${m.needed.toFixed(3)})`
        )
        .join(', ')

      logger.warn(`[STORE PEDIDO] Insumos insuficientes: ${missingDetails}`)
      throw new Error(`Insumos insuficientes: ${missingDetails}`)
    }

    let pedido: Pedido | null = null
    let attempts = 0
    const maxAttempts = 3

    while (!pedido && attempts < maxAttempts) {
      attempts++
      try {
        const orderNumber = await Pedido.generateNumeroPedido(user.empresaId, timezone)

        pedido = await Pedido.create({
          empresaId: user.empresaId,
          comandaId: data.comandaId,
          userId: user.id,
          funcionarioId: data.waiterId || null,
          orderNumber,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          type: data.type,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
          discount: data.discount || 0,
          serviceCharge: data.serviceCharge || 0,
        })

        for (const itemData of data.items) {
          await pedido.addItem(
            itemData.cardapioProductId,
            itemData.quantity,
            itemData.specialInstructions
          )
        }

        try {
          await insumoStockService.reserveInsumoFromOrder(pedido)
          logger.info(
            `[INSUMO RESERVATION] Insumos reservados com sucesso para pedido ${pedido.id}`
          )
        } catch (reserveError: any) {
          logger.error(
            `[INSUMO RESERVATION ERROR] Erro ao reservar insumos do pedido ${pedido.id}: ${reserveError.message}`
          )
          await pedido.delete()
          throw new Error(`Falha ao reservar insumos: ${reserveError.message}`)
        }

        logger.info(
          `[PEDIDOS STORE] SUCCESS | Pedido ID: ${pedido.id} | Number: ${orderNumber} | Items: ${data.items.length} | User: ${user.id} | Attempts: ${attempts}`
        )
      } catch (err: any) {
        if (err.code === '23505' && attempts < maxAttempts) {
          logger.warn(
            `[PEDIDOS STORE] Duplicate order number detected, retrying... (attempt ${attempts}/${maxAttempts})`
          )
          await new Promise((resolve) => setTimeout(resolve, 100 * attempts))
          continue
        }
        throw err
      }
    }

    if (!pedido) {
      throw new Error('Falha ao criar pedido apos multiplas tentativas')
    }

    return pedido
  }

  static async updatePedido(pedido: Pedido, data: PedidoUpdateData, logger: any): Promise<void> {
    if (data.comandaId !== undefined) {
      pedido.comandaId = data.comandaId
    }

    pedido.merge({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
    })

    if (data.discount !== undefined) {
      pedido.discount = Number(data.discount) || 0
    }
    if (data.serviceCharge !== undefined) {
      pedido.serviceCharge = Number(data.serviceCharge) || 0
    }

    await pedido.save()

    if (data.itemsJson) {
      try {
        const items = JSON.parse(data.itemsJson)
        logger.info(`[UPDATE PEDIDO] Items: ${JSON.stringify(items)}`)

        if (Array.isArray(items) && items.length > 0) {
          await PedidoItem.query().where('pedido_id', pedido.id).delete()

          for (const item of items) {
            const quantity = Number(item.quantity) || 1
            const unitPrice = Number(item.unitPrice) || 0
            const totalPrice = quantity * unitPrice

            await PedidoItem.create({
              pedidoId: pedido.id,
              cardapioProdutoId: item.menuItemId,
              itemName: item.itemName || 'Item sem nome',
              quantity,
              unitPrice,
              totalPrice,
              specialInstructions: item.notes || null,
            })
          }
        }
      } catch (parseError: any) {
        logger.error(`[UPDATE PEDIDO] Items parse error: ${parseError.message}`)
      }
    }

    await pedido.calculateTotals()
  }
}
