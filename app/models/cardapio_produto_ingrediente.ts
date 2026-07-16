import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CardapioProduto from './cardapio_produto.js'
import Insumo from './insumo.js'

export default class CardapioProdutoIngrediente extends BaseModel {
  static table = 'tavolo.cardapio_produtos_ingredientes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cardapioProdutoId: number

  @column()
  declare insumoId: number

  @column()
  declare quantity: number

  @column()
  declare unit: string

  @column()
  declare unitCost: number

  @column()
  declare totalCost: number

  @column()
  declare optional: boolean

  @column()
  declare notes: string | null

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => CardapioProduto, {
    foreignKey: 'cardapioProdutoId',
  })
  declare cardapioProduto: BelongsTo<typeof CardapioProduto>

  @belongsTo(() => Insumo, {
    foreignKey: 'insumoId',
  })
  declare insumo: BelongsTo<typeof Insumo>

  // Getters
  get isAvailable() {
    if (!this.insumo) return false
    if (!this.insumo.stockControl) return true
    return this.insumo.currentStock >= this.quantity
  }

  get stockStatus() {
    if (!this.insumo) return 'unknown'
    if (!this.insumo.stockControl) return 'no_control'

    const available = this.insumo.currentStock
    if (available >= this.quantity) return 'available'
    if (available > 0) return 'insufficient'
    return 'unavailable'
  }

  get stockStatusColor() {
    const colors = {
      available: 'green',
      insufficient: 'orange',
      unavailable: 'red',
      no_control: 'gray',
      unknown: 'gray',
    }
    return colors[this.stockStatus]
  }

  get formattedQuantity() {
    return `${this.quantity} ${this.unit}`
  }

  // Métodos
  async updateCost() {
    if (this.insumo) {
      this.unitCost = this.insumo.purchasePrice || 0
      this.totalCost = this.quantity * this.unitCost
      await this.save()
    }
  }

  async updateQuantity(newQuantity: number) {
    this.quantity = newQuantity
    this.totalCost = this.quantity * this.unitCost
    await this.save()
  }

  async checkAvailability() {
    if (!this.insumo) return false
    if (!this.insumo.stockControl) return true

    await this.insumo.refresh()
    return this.insumo.currentStock >= this.quantity
  }
}
