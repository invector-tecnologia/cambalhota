import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Comanda from './comanda.js'

export default class Mesa extends BaseModel {
  static table = 'tavolo.mesas'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare number: string

  @column()
  declare name: string | null

  @column()
  declare location: string | null

  @column()
  declare status: 'available' | 'occupied' | 'reserved' | 'maintenance'

  @column()
  declare capacity: number | null

  @column()
  declare active: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @hasMany(() => Comanda, { foreignKey: 'mesaId' })
  declare comandas: HasMany<typeof Comanda>

  // Business methods
  get displayName() {
    return this.name || `Mesa ${this.number}`
  }

  async getActiveComandas() {
    return await Comanda.query()
      .where('mesa_id', this.id)
      .where('active', true)
      .orderBy('number', 'asc')
  }

  async getComandaCount() {
    const result = await Comanda.query()
      .where('mesa_id', this.id)
      .where('active', true)
      .count('* as total')
    return result[0].$extras.total || 0
  }
}
