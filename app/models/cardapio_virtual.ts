import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'

export default class CardapioVirtual extends BaseModel {
  static table = 'tavolo.cardapios_virtuais'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare slug: string

  @column()
  declare status: 'draft' | 'published'

  @column()
  declare theme: string

  @column()
  declare settings: Record<string, any> | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  get isPublished() {
    return this.status === 'published'
  }

  get publicUrl() {
    return `/cardapio/${this.slug}`
  }
}
