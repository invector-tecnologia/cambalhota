import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Fornecedor from './fornecedor.js'

export default class Insumo extends BaseModel {
  static table = 'tavolo.insumos'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare code: string | null

  @column()
  declare barcode: string | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare type: 'ingredient' | 'finished_product' | 'beverage' | 'supply'

  @column()
  declare category: string | null

  @column()
  declare subcategory: string | null

  @column()
  declare unit: string

  @column()
  declare purchaseUnit: string | null

  @column()
  declare conversionFactor: number

  @column()
  declare purchasePrice: number

  @column()
  declare salePrice: number | null

  @column()
  declare costPrice: number | null

  @column()
  declare currentStock: number

  @column()
  declare minimumStock: number

  @column()
  declare maximumStock: number | null

  @column()
  declare stockControl: boolean

  @column()
  declare ncm: string | null

  @column()
  declare cest: string | null

  @column()
  declare taxRate: number

  @column()
  declare fornecedorPadraoId: number | null

  @column()
  declare perishable: boolean

  @column()
  declare shelfLifeDays: number | null

  @column()
  declare active: boolean

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Fornecedor, {
    foreignKey: 'fornecedorPadraoId',
  })
  declare fornecedorPadrao: BelongsTo<typeof Fornecedor>

  // Getters
  get formattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.purchasePrice)
  }

  get formattedSalePrice(): string {
    if (!this.salePrice) return 'N/A'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.salePrice)
  }

  get stockStatus(): 'low' | 'normal' | 'high' {
    if (this.currentStock <= this.minimumStock) return 'low'
    if (this.maximumStock && this.currentStock >= this.maximumStock) return 'high'
    return 'normal'
  }

  get stockStatusText(): string {
    switch (this.stockStatus) {
      case 'low':
        return 'Estoque baixo'
      case 'high':
        return 'Estoque alto'
      default:
        return 'Normal'
    }
  }

  // Métodos
  static async findByCode(code: string, companyId: number) {
    return this.query().where('code', code).where('companyId', companyId).first()
  }

  static async findByBarcode(barcode: string, companyId: number) {
    return this.query().where('barcode', barcode).where('companyId', companyId).first()
  }

  static async lowStockProducts(companyId: number) {
    return this.query()
      .where('companyId', companyId)
      .where('active', true)
      .where('stockControl', true)
      .whereRaw('current_stock <= minimum_stock')
      .orderBy('currentStock')
  }

  async updateStock(quantity: number, operation: 'add' | 'subtract') {
    if (operation === 'add') {
      this.currentStock += quantity
    } else {
      this.currentStock = Math.max(0, this.currentStock - quantity)
    }
    await this.save()
  }
}
