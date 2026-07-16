import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import CardapioProduto from './cardapio_produto.js'

export default class CardapioCategoria extends BaseModel {
  static table = 'tavolo.cardapio_categorias'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare color: string

  @column()
  declare sortOrder: number

  @column()
  declare active: boolean

  @column()
  declare showInMenu: boolean

  @column()
  declare availableFrom: string | null

  @column()
  declare availableUntil: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @hasMany(() => CardapioProduto, { foreignKey: 'cardapioCategoriaId' })
  declare cardapioProdutos: HasMany<typeof CardapioProduto>

  // Getters
  get statusColor() {
    return this.active ? 'green' : 'gray'
  }

  get isAvailable() {
    if (!this.active || !this.showInMenu) return false

    if (!this.availableFrom || !this.availableUntil) return true

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [fromHours, fromMinutes] = this.availableFrom.split(':').map(Number)
    const [untilHours, untilMinutes] = this.availableUntil.split(':').map(Number)

    const fromTime = fromHours * 60 + fromMinutes
    const untilTime = untilHours * 60 + untilMinutes

    return currentTime >= fromTime && currentTime <= untilTime
  }

  // Métodos
  async getAvailableItems() {
    await this.load('cardapioProdutos' as any, (query) => {
      query.where('active', true).where('available', true).orderBy('sortOrder')
    })
    return this.cardapioProdutos
  }

  async updateSortOrder(newOrder: number) {
    this.sortOrder = newOrder
    await this.save()
  }

  async toggleActive() {
    this.active = !this.active
    await this.save()
  }
}
