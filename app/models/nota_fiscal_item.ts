import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Nfe from './nfe.js'
import Insumo from './insumo.js'

export default class NotaFiscalItem extends BaseModel {
  static table = 'tavolo.nota_fiscal_itens'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare notaFiscalId: number

  @column()
  declare insumoId: number | null

  @column()
  declare code: string | null

  @column()
  declare barcode: string | null

  @column()
  declare description: string

  @column()
  declare ncm: string | null

  @column()
  declare unit: string

  @column()
  declare quantity: number

  @column()
  declare unitValue: number

  @column()
  declare totalValue: number

  @column()
  declare taxValue: number

  @column()
  declare processed: boolean

  @column()
  declare stockUpdated: boolean

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Nfe, { foreignKey: 'notaFiscalId' })
  declare notaFiscal: BelongsTo<typeof Nfe>

  @belongsTo(() => Insumo, { foreignKey: 'insumoId' })
  declare insumo: BelongsTo<typeof Insumo>

  // Getters
  get hasSupply() {
    return this.insumoId !== null
  }

  get processStatus() {
    if (!this.processed) return 'Pendente'
    if (this.processed && !this.stockUpdated) return 'Processado'
    return 'Estoque Atualizado'
  }

  get processStatusColor() {
    if (!this.processed) return 'yellow'
    if (this.processed && !this.stockUpdated) return 'blue'
    return 'green'
  }

  // Métodos
  async linkToSupply(productId: number) {
    this.insumoId = productId
    this.processed = true
    await this.save()
  }

  async markStockUpdated() {
    this.stockUpdated = true
    await this.save()
  }

  async addNote(note: string) {
    this.notes = this.notes ? `${this.notes}\n${note}` : note
    await this.save()
  }
}
