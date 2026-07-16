import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Insumo from './insumo.js'
import Pedido from './pedido.js'
import PedidoItem from './pedido_item.js'

export default class InsumoReserva extends BaseModel {
  static table = 'tavolo.insumo_reservas'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare insumoId: number

  @column()
  declare pedidoId: number

  @column()
  declare pedidoItemId: number

  @column()
  declare quantidade: number

  @column()
  declare unidade: string

  @column()
  declare status: 'reserved' | 'deducted' | 'released'

  @column.dateTime()
  declare reservedAt: DateTime

  @column.dateTime()
  declare deductedAt: DateTime | null

  @column.dateTime()
  declare releasedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Insumo, { foreignKey: 'insumoId' })
  declare insumo: BelongsTo<typeof Insumo>

  @belongsTo(() => Pedido, { foreignKey: 'pedidoId' })
  declare pedido: BelongsTo<typeof Pedido>

  @belongsTo(() => PedidoItem, { foreignKey: 'pedidoItemId' })
  declare pedidoItem: BelongsTo<typeof PedidoItem>

  // Métodos
  async markAsDeducted() {
    this.status = 'deducted'
    this.deductedAt = DateTime.now()
    await this.save()
  }

  async release() {
    this.status = 'released'
    this.releasedAt = DateTime.now()
    await this.save()
  }

  // Scopes
  static reserved() {
    return this.query().where('status', 'reserved')
  }

  static deducted() {
    return this.query().where('status', 'deducted')
  }

  static released() {
    return this.query().where('status', 'released')
  }

  static byPedido(pedidoId: number) {
    return this.query().where('pedido_id', pedidoId)
  }

  static byInsumo(insumoId: number) {
    return this.query().where('insumo_id', insumoId)
  }
}
