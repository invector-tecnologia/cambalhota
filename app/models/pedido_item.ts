import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Pedido from './pedido.js'
import CardapioProduto from './cardapio_produto.js'

function nowInTimezone(timezone?: string): DateTime {
  return timezone ? DateTime.now().setZone(timezone) : DateTime.now()
}

export default class PedidoItem extends BaseModel {
  static table = 'tavolo.pedido_itens'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare pedidoId: number

  @column()
  declare cardapioProdutoId: number

  @column()
  declare itemName: string

  @column()
  declare unitPrice: number

  @column()
  declare quantity: number

  @column()
  declare totalPrice: number

  @column()
  declare status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'

  @column()
  declare specialInstructions: string | null

  @column({
    serialize: (value: string | null) => {
      return value ? JSON.parse(value) : null
    },
  })
  declare customizations: any | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare preparedAt: DateTime | null

  @column.dateTime()
  declare servedAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Pedido, { foreignKey: 'pedidoId' })
  declare pedido: BelongsTo<typeof Pedido>

  @belongsTo(() => CardapioProduto, { foreignKey: 'cardapioProdutoId' })
  declare cardapioProduto: BelongsTo<typeof CardapioProduto>

  // Business methods
  get statusBadge() {
    const statusMap = {
      pending: { color: 'yellow', text: 'Pendente' },
      preparing: { color: 'orange', text: 'Preparando' },
      ready: { color: 'purple', text: 'Pronto' },
      served: { color: 'green', text: 'Servido' },
      cancelled: { color: 'red', text: 'Cancelado' },
    }
    return statusMap[this.status] || { color: 'gray', text: 'Desconhecido' }
  }

  get canEdit() {
    return ['pending'].includes(this.status)
  }

  get canCancel() {
    return ['pending', 'preparing'].includes(this.status)
  }

  // Métodos de conversão de valores monetários
  static toBrazilianFormat(value: number): string {
    return value.toFixed(2).replace('.', ',')
  }

  static toAmericanFormat(value: string | number): number {
    if (typeof value === 'number') return value
    return Number.parseFloat(value.replace(',', '.'))
  }

  get unitPriceBR(): string {
    return PedidoItem.toBrazilianFormat(this.unitPrice)
  }

  get totalPriceBR(): string {
    return PedidoItem.toBrazilianFormat(this.totalPrice)
  }

  get formattedPrice() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.unitPrice)
  }

  get formattedTotal() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.totalPrice)
  }

  async updateQuantity(newQuantity: number) {
    this.quantity = Number(newQuantity) || 0
    this.totalPrice = Number(this.unitPrice) * this.quantity
    await this.save()

    // Recalcular totais do pedido
    const pedido = await this.related('pedido' as any)
      .query()
      .first()
    if (pedido) {
      await pedido.calculateTotals()
    }
  }

  async startPreparing(timezone?: string) {
    this.status = 'preparing'
    this.startedAt = nowInTimezone(timezone)
    await this.save()
  }

  async markPending() {
    this.status = 'pending'
    this.startedAt = null
    this.preparedAt = null
    this.servedAt = null
    await this.save()
  }

  async markReady(timezone?: string) {
    this.status = 'ready'
    this.preparedAt = nowInTimezone(timezone)
    await this.save()
  }

  async serve(timezone?: string) {
    this.status = 'served'
    this.servedAt = nowInTimezone(timezone)
    await this.save()
  }

  async cancel(timezone?: string) {
    this.status = 'cancelled'
    this.cancelledAt = nowInTimezone(timezone)
    await this.save()

    // Liberar reservas de insumos se ainda estiverem reservadas (antes do preparo)
    try {
      const module = await import('../services/insumo_stock_service.js')
      const insumoStockService = module.default
      await insumoStockService.releaseInsumoReservationForItem(this.id)
    } catch (error) {
      // Log do erro mas não interrompe o fluxo
      console.error(
        `[RELEASE ITEM RESERVA ERROR] Erro ao liberar reserva do item ${this.id}:`,
        error.message
      )
    }

    // Recalcular totais do pedido
    await this.load('pedido' as any)
    if (this.pedido) {
      await this.pedido.calculateTotals()
    }
  }

  // Scopes
  static byStatus(status: string) {
    return this.query().where('status', status)
  }

  static active() {
    return this.query().whereIn('status', ['pending', 'preparing', 'ready'])
  }

  static pending() {
    return this.query().where('status', 'pending')
  }

  static preparing() {
    return this.query().where('status', 'preparing')
  }

  static ready() {
    return this.query().where('status', 'ready')
  }
}
