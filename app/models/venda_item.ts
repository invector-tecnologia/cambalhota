import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Venda from '#models/venda'
import CardapioProduto from '#models/cardapio_produto'
import PedidoItem from '#models/pedido_item'

export default class VendaItem extends BaseModel {
  static table = 'tavolo.venda_itens'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare vendaId: number

  @column()
  declare cardapioProdutoId: number

  @column()
  declare pedidoItemId: number | null

  @column()
  declare itemName: string

  @column({ consume: (value: string | number) => Number(value) })
  declare unitPrice: number

  @column({ consume: (value: string | number) => Number(value) })
  declare unitCost: number

  @column()
  declare quantity: number

  @column({ consume: (value: string | number) => Number(value) })
  declare subtotal: number

  @column({ consume: (value: string | number) => Number(value) })
  declare costTotal: number

  @column({ consume: (value: string | number) => Number(value) })
  declare profit: number

  @column({ consume: (value: string | number) => Number(value) })
  declare profitMargin: number

  @column()
  declare specialInstructions: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Venda, { foreignKey: 'vendaId' })
  declare venda: BelongsTo<typeof Venda>

  @belongsTo(() => CardapioProduto, { foreignKey: 'cardapioProdutoId' })
  declare cardapioProduto: BelongsTo<typeof CardapioProduto>

  @belongsTo(() => PedidoItem, { foreignKey: 'pedidoItemId' })
  declare pedidoItem: BelongsTo<typeof PedidoItem>

  @beforeCreate()
  public static setDefaults(saleItem: VendaItem) {
    if (saleItem.unitPrice === undefined) {
      saleItem.unitPrice = 0
    }
    if (saleItem.unitCost === undefined) {
      saleItem.unitCost = 0
    }
    if (saleItem.quantity === undefined) {
      saleItem.quantity = 0
    }
  }

  @beforeSave()
  static async calculateTotals(saleItem: VendaItem) {
    // Calcular subtotal
    saleItem.subtotal = saleItem.unitPrice * saleItem.quantity

    // Calcular custo total
    saleItem.costTotal = saleItem.unitCost * saleItem.quantity

    // Calcular lucro
    saleItem.profit = saleItem.subtotal - saleItem.costTotal

    // Calcular margem de lucro
    saleItem.profitMargin = saleItem.subtotal > 0 ? (saleItem.profit / saleItem.subtotal) * 100 : 0
  }

  get profitBadge() {
    if (this.profitMargin >= 50) {
      return { text: 'Excelente', class: 'bg-green-100 text-green-800' }
    } else if (this.profitMargin >= 30) {
      return { text: 'Boa', class: 'bg-blue-100 text-blue-800' }
    } else if (this.profitMargin >= 15) {
      return { text: 'Regular', class: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { text: 'Baixa', class: 'bg-red-100 text-red-800' }
    }
  }
}
