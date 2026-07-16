import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Supplier from './fornecedor.js'
import NotaFiscalItem from './nota_fiscal_item.js'
import User from './user.js'

export default class Nfe extends BaseModel {
  static table = 'tavolo.notas_fiscais'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare fornecedorId: number

  @column()
  declare accessKey: string

  @column()
  declare number: string

  @column()
  declare series: string

  @column()
  declare model: string

  @column.dateTime()
  declare issueDate: DateTime

  @column.dateTime()
  declare entryDate: DateTime | null

  @column()
  declare totalValue: number

  @column()
  declare productsValue: number

  @column()
  declare taxValue: number

  @column()
  declare freightValue: number

  @column()
  declare discountValue: number

  @column()
  declare status: 'pending' | 'processing' | 'processed' | 'error'

  @column()
  declare errorMessage: string | null

  @column()
  declare xmlContent: string | null

  @column()
  declare processedBy: number | null

  @column.dateTime()
  declare processedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Supplier, { foreignKey: 'fornecedorId' })
  declare fornecedor: BelongsTo<typeof Supplier>

  @belongsTo(() => User, {
    foreignKey: 'processedBy',
  })
  declare processedByUser: BelongsTo<typeof User>

  @hasMany(() => NotaFiscalItem, { foreignKey: 'notaFiscalId' })
  declare items: HasMany<typeof NotaFiscalItem>

  // Getters
  get statusDisplay() {
    const statusMap = {
      pending: 'Pendente',
      processing: 'Processando',
      processed: 'Processada',
      error: 'Erro',
    }
    return statusMap[this.status]
  }

  get statusColor() {
    const colorMap = {
      pending: 'yellow',
      processing: 'blue',
      processed: 'green',
      error: 'red',
    }
    return colorMap[this.status]
  }

  // Métodos
  async markAsProcessing(userId: number) {
    this.status = 'processing'
    this.processedBy = userId
    this.processedAt = DateTime.now()
    await this.save()
  }

  async markAsProcessed() {
    this.status = 'processed'
    await this.save()
  }

  async markAsError(errorMessage: string) {
    this.status = 'error'
    this.errorMessage = errorMessage
    await this.save()
  }

  async updateStockEntry() {
    this.entryDate = DateTime.now()
    await this.save()
  }
}
