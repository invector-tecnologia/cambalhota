import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import CardapioCategoria from './cardapio_categoria.js'
import CardapioProdutoIngrediente from './cardapio_produto_ingrediente.js'

export default class CardapioProduto extends BaseModel {
  static table = 'tavolo.cardapio_produtos'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare cardapioCategoriaId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare costPrice: number

  @column()
  declare salePrice: number

  @column()
  declare markupPercentage: number

  @column()
  declare calories: number | null

  @column()
  declare protein: number | null

  @column()
  declare carbs: number | null

  @column()
  declare fat: number | null

  @column()
  declare active: boolean

  @column()
  declare available: boolean

  @column()
  declare sortOrder: number

  @column()
  declare preparationTime: number

  @column()
  declare requiresPreparation: boolean

  // Campos fiscais para emissão de NFC-e
  @column()
  declare ncm: string | null

  @column()
  declare cfop: string

  @column()
  declare cstIcms: string | null

  @column()
  declare csosn: string | null

  @column()
  declare icmsRate: number

  @column()
  declare pisRate: number

  @column()
  declare cofinsRate: number

  @column()
  declare cest: string | null

  @column()
  declare unit: string

  @column()
  declare barcode: string | null

  @column()
  declare origem: number

  @column()
  declare trackStock: boolean

  @column()
  declare dailyLimit: number | null

  @column()
  declare dailySold: number

  @column()
  declare availableFrom: string | null

  @column()
  declare availableUntil: string | null

  @column({
    prepare: (value: number[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | number[] | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value)
      return value
    },
  })
  declare availableDays: number[] | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value)
      return value
    },
  })
  declare allergens: string[] | null

  @column()
  declare vegetarian: boolean

  @column()
  declare vegan: boolean

  @column()
  declare glutenFree: boolean

  @column()
  declare lactoseFree: boolean

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value)
      return value
    },
  })
  declare tags: string[] | null

  @column()
  declare spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very_hot'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => CardapioCategoria, { foreignKey: 'cardapioCategoriaId' })
  declare cardapioCategoria: BelongsTo<typeof CardapioCategoria>

  @hasMany(() => CardapioProdutoIngrediente, { foreignKey: 'cardapioProdutoId' })
  declare ingredientes: HasMany<typeof CardapioProdutoIngrediente>

  // Getters
  get isAvailable() {
    if (!this.active || !this.available) return false

    // Verificar limite diário
    if (this.dailyLimit && this.dailySold >= this.dailyLimit) return false

    // Verificar horário
    if (this.availableFrom && this.availableUntil) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()

      const [fromHours, fromMinutes] = this.availableFrom.split(':').map(Number)
      const [untilHours, untilMinutes] = this.availableUntil.split(':').map(Number)

      const fromTime = fromHours * 60 + fromMinutes
      const untilTime = untilHours * 60 + untilMinutes

      if (currentTime < fromTime || currentTime > untilTime) return false
    }

    // Verificar dia da semana
    if (this.availableDays && this.availableDays.length > 0) {
      const today = new Date().getDay()
      if (!this.availableDays.includes(today)) return false
    }

    return true
  }

  get profitMargin() {
    if (this.salePrice === 0) return 0
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100
  }

  get spiceLevelDisplay() {
    const levels = {
      none: 'Sem Pimenta',
      mild: 'Suave',
      medium: 'Médio',
      hot: 'Picante',
      very_hot: 'Muito Picante',
    }
    return levels[this.spiceLevel]
  }

  get dietaryLabels() {
    const labels = []
    if (this.vegetarian) labels.push('Vegetariano')
    if (this.vegan) labels.push('Vegano')
    if (this.glutenFree) labels.push('Sem Glúten')
    if (this.lactoseFree) labels.push('Sem Lactose')
    return labels
  }

  get statusColor() {
    if (!this.active) return 'gray'
    if (!this.available) return 'red'
    if (!this.isAvailable) return 'orange'
    return 'green'
  }

  // Métodos
  async calculateCostPrice() {
    await this.load('ingredientes' as any, (query) => {
      query.preload('insumo')
    })

    let totalCost = 0
    for (const ingrediente of this.ingredientes) {
      if (ingrediente.insumo) {
        const unitCost = ingrediente.insumo.purchasePrice || 0
        ingrediente.unitCost = unitCost
        ingrediente.totalCost = ingrediente.quantity * unitCost
        totalCost += ingrediente.totalCost
        await ingrediente.save()
      }
    }

    this.costPrice = totalCost
    await this.save()
    return totalCost
  }

  async updateMarkupPrice() {
    if (this.markupPercentage > 0) {
      this.salePrice = this.costPrice * (1 + this.markupPercentage / 100)
      await this.save()
    }
  }

  async checkStockAvailability() {
    if (!this.trackStock) return true

    await this.preload('ingredientes' as any, (query) => {
      query.preload('insumo')
    })

    for (const ingredient of this.ingredientes) {
      if (ingredient.insumo && ingredient.insumo.stockControl) {
        if (ingredient.insumo.currentStock < ingredient.quantity) {
          return false
        }
      }
    }

    return true
  }

  async incrementDailySold(quantity: number = 1) {
    this.dailySold += quantity
    await this.save()
  }

  async resetDailySold() {
    this.dailySold = 0
    await this.save()
  }

  async toggleAvailable() {
    this.available = !this.available
    await this.save()
  }

  /**
   * Obtém a quantidade máxima que pode ser preparada com base nos insumos disponíveis
   */
  async getMaxPrepareQuantity(): Promise<number> {
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default
    return insumoStockService.getMaxPossibleQuantity(this.id)
  }

  /**
   * Verifica se o produto tem insumos suficientes para ser preparado
   */
  async isAvailableForPrepare(quantity: number = 1): Promise<boolean> {
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default
    const availability = await insumoStockService.checkProductAvailability(this.id, quantity)
    return availability.available
  }

  /**
   * Retorna detalhes sobre insumos faltantes
   */
  async getMissingInsumos(
    quantity: number = 1
  ): Promise<Array<{ name: string; available: number; needed: number }>> {
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default
    const availability = await insumoStockService.checkProductAvailability(this.id, quantity)
    return availability.missingInsumos
  }
}
