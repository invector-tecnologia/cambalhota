import { DateTime } from 'luxon'
import { BaseModel, afterUpdate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Comanda from './comanda.js'
import User from './user.js'
import Funcionario from './funcionario.js'
import PedidoItem from './pedido_item.js'

function nowInTimezone(timezone?: string): DateTime {
  return timezone ? DateTime.now().setZone(timezone) : DateTime.now()
}

export default class Pedido extends BaseModel {
  @afterUpdate()
  static async checkComandaStatus(pedido: Pedido) {
    if (pedido.$dirty.status === 'paid' && pedido.comandaId) {
      const comanda = await Comanda.find(pedido.comandaId)
      if (comanda) {
        await comanda.checkAndCloseIfCompleted()
      }
    }
  }

  static table = 'tavolo.pedidos'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare comandaId: number | null

  @column()
  declare userId: number

  @column()
  declare funcionarioId: number | null

  @column()
  declare orderNumber: string

  @column()
  declare customerName: string | null

  @column()
  declare customerPhone: string | null

  @column()
  declare type: 'dine_in' | 'takeout' | 'delivery'

  @column()
  declare status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid'

  @column()
  declare subtotal: number

  @column()
  declare discount: number

  @column()
  declare serviceCharge: number

  @column()
  declare total: number

  @column()
  declare notes: string | null

  @column()
  declare deliveryAddress: string | null

  @column.dateTime()
  declare confirmedAt: DateTime | null

  @column.dateTime()
  declare preparedAt: DateTime | null

  @column.dateTime()
  declare servedAt: DateTime | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Comanda, { foreignKey: 'comandaId' })
  declare comanda: BelongsTo<typeof Comanda>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Funcionario, { foreignKey: 'funcionarioId' })
  declare funcionario: BelongsTo<typeof Funcionario>

  @hasMany(() => PedidoItem, { foreignKey: 'pedidoId' })
  declare items: HasMany<typeof PedidoItem>

  // Business methods
  get displayNumber() {
    return this.orderNumber || `#${this.id}`
  }

  get statusBadge() {
    const statusMap = {
      pending: { color: 'yellow', text: 'Pendente' },
      confirmed: { color: 'blue', text: 'Confirmado' },
      preparing: { color: 'orange', text: 'Preparando' },
      ready: { color: 'purple', text: 'Pronto' },
      served: { color: 'green', text: 'Servido' },
      cancelled: { color: 'red', text: 'Cancelado' },
      paid: { color: 'green', text: 'Pago' },
    }
    return statusMap[this.status] || { color: 'gray', text: 'Desconhecido' }
  }

  get typeBadge() {
    const typeMap = {
      dine_in: { color: 'blue', text: 'Salão' },
      takeout: { color: 'green', text: 'Balcão' },
      delivery: { color: 'purple', text: 'Delivery' },
    }
    return typeMap[this.type] || { color: 'gray', text: 'Desconhecido' }
  }

  get isActive() {
    return ['pending', 'confirmed', 'preparing', 'ready'].includes(this.status)
  }

  get canEdit() {
    return ['pending', 'confirmed'].includes(this.status)
  }

  get canCancel() {
    // Só permite cancelar antes de iniciar preparo
    // Após 'preparing', insumos já foram debitados e não podem ser devolvidos automaticamente
    return ['pending', 'confirmed'].includes(this.status)
  }

  get elapsedTime() {
    if (!this.createdAt) return null
    const now = DateTime.now()
    const diff = now.diff(this.createdAt, ['hours', 'minutes'])
    return `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes % 60)}min`
  }

  // Métodos de conversão de valores monetários
  static toBrazilianFormat(value: number): string {
    return value.toFixed(2).replace('.', ',')
  }

  static toAmericanFormat(value: string | number): number {
    if (typeof value === 'number') return value
    return Number.parseFloat(value.replace(',', '.'))
  }

  get subtotalBR(): string {
    return Pedido.toBrazilianFormat(this.subtotal)
  }

  get discountBR(): string {
    return Pedido.toBrazilianFormat(this.discount)
  }

  get serviceChargeBR(): string {
    return Pedido.toBrazilianFormat(this.serviceCharge)
  }

  get totalBR(): string {
    return Pedido.toBrazilianFormat(this.total)
  }

  async calculateTotals() {
    await this.load('items' as any)

    // Garantir que todos os valores sejam numéricos
    this.subtotal = this.items.reduce((sum, item) => {
      const itemTotal = Number(item.totalPrice) || 0
      return sum + itemTotal
    }, 0)

    // Calcular taxa de serviço (10% para pedidos do salão)
    if (this.type === 'dine_in') {
      this.serviceCharge = this.subtotal * 0.1
    }

    // Garantir que discount e serviceCharge sejam números
    const discount = Number(this.discount) || 0
    const serviceCharge = Number(this.serviceCharge) || 0

    this.total = this.subtotal + serviceCharge - discount
    await this.save()
  }

  async addItem(cardapioProduto: number, quantity: number, specialInstructions?: string) {
    const cardapioProdutoModule = await import('./cardapio_produto.js')
    const CardapioProduto = cardapioProdutoModule.default
    const cardapioProdutoObj = await CardapioProduto.findOrFail(cardapioProduto)

    const unitPrice = Number(cardapioProdutoObj.salePrice) || 0
    const qty = Number(quantity) || 0

    const pedidoItem = await PedidoItem.create({
      pedidoId: this.id,
      cardapioProdutoId: cardapioProduto,
      itemName: cardapioProdutoObj.name,
      unitPrice: unitPrice,
      quantity: qty,
      totalPrice: unitPrice * qty,
      specialInstructions,
    })

    await this.calculateTotals()
    return pedidoItem
  }

  async updateItemQuantity(pedidoItemId: number, quantity: number) {
    const item = await PedidoItem.findOrFail(pedidoItemId)
    const qty = Number(quantity) || 0
    item.quantity = qty
    item.totalPrice = Number(item.unitPrice) * qty
    await item.save()

    await this.calculateTotals()
  }

  async removeItem(pedidoItemId: number) {
    const item = await PedidoItem.findOrFail(pedidoItemId)
    await item.delete()
    await this.calculateTotals()
  }

  async confirm(timezone?: string) {
    this.status = 'confirmed'
    this.confirmedAt = nowInTimezone(timezone)
    await this.save()

    // Ocupar mesa se for pedido do salão
    if (this.comandaId && this.type === 'dine_in') {
      const comanda = await this.related('comanda' as any)
        .query()
        .first()
      if (comanda) {
        await comanda.occupy()
      }
    }
  }

  async startPreparing() {
    this.status = 'preparing'
    await this.save()
  }

  async markReady(timezone?: string) {
    this.status = 'ready'
    this.preparedAt = nowInTimezone(timezone)
    await this.save()
  }

  /**
   * Desconta os insumos do almoxarifado quando o pedido entra em preparo
   * Este método é chamado automaticamente quando o pedido muda para status 'preparing'
   * IMPORTANTE: Só deve ser chamado UMA VEZ, na primeira transição para preparing
   */
  async deductInsumoStock() {
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default
    await insumoStockService.deductInsumoFromOrder(this)
  }

  async serve(timezone?: string) {
    this.status = 'served'
    this.servedAt = nowInTimezone(timezone)
    await this.save()
  }

  /**
   * Libera as reservas de insumos do pedido
   * Chamado quando um pedido é cancelado ANTES de iniciar o preparo
   */
  async releaseInsumoReservation() {
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default
    await insumoStockService.releaseInsumoReservation(this)
  }

  async cancel(timezone?: string) {
    this.status = 'cancelled'
    this.cancelledAt = nowInTimezone(timezone)
    await this.save()

    // Liberar reservas de insumos quando pedido é cancelado ANTES de entrar em preparo
    // Isso garante que a quantidade fica disponível para outros pedidos
    // NOTA: Este método só deve ser chamado para pedidos em pending/confirmed
    // Pedidos em preparing/ready/served já tiveram insumos debitados e não podem ser revertidos automaticamente
    try {
      await this.releaseInsumoReservation()
    } catch (error) {
      // Log do erro mas não interrompe o fluxo
      console.error(
        `[RELEASE RESERVA ERROR] Erro ao liberar reserva do pedido ${this.id}:`,
        error.message
      )
    }

    // Liberar mesa
    if (this.comandaId && this.type === 'dine_in') {
      const comanda = await this.related('comanda' as any)
        .query()
        .first()
      if (comanda) {
        await comanda.free()
      }
    }
  }

  async pay(timezone?: string) {
    this.status = 'paid'
    this.paidAt = nowInTimezone(timezone)
    await this.save()

    // Liberar mesa
    if (this.comandaId && this.type === 'dine_in') {
      const comanda = await this.related('comanda' as any)
        .query()
        .first()
      if (comanda) {
        await comanda.free()
      }
    }
  }

  // Static methods for generating order numbers
  static async generateNumeroPedido(empresaId: number, timezone?: string): Promise<string> {
    const today = nowInTimezone(timezone).toFormat('yyyyMMdd')
    const prefix = `${today}-`

    // Buscar o último pedido do dia ordenado por order_number descendente
    const lastPedido = await this.query()
      .where('empresa_id', empresaId)
      .where('order_number', 'like', `${prefix}%`)
      .orderBy('order_number', 'desc')
      .select('order_number')
      .first()

    let nextNumber = 1
    if (lastPedido?.orderNumber) {
      // Extrair o número sequencial do último pedido (ex: "20251211-0001" -> 1)
      const match = lastPedido.orderNumber.match(/-(\d+)$/)
      if (match) {
        nextNumber = Number.parseInt(match[1], 10) + 1
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`
  }

  // Scopes
  static pedidosAtivos() {
    return this.query().whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
  }

  static byTable(comandaId: number) {
    return this.query().where('comanda_id', comandaId)
  }

  static byStatus(status: string) {
    return this.query().where('status', status)
  }

  static today(timezone?: string) {
    return this.query().where('created_at', '>=', nowInTimezone(timezone).startOf('day').toISO()!)
  }
}
