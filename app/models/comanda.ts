import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import Pedido from './pedido.js'
import Mesa from './mesa.js'

export default class Comanda extends BaseModel {
  static table = 'tavolo.comandas'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare mesaId: number | null

  @column()
  declare number: string

  @column()
  declare name: string | null

  @column()
  declare notes: string | null

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => Mesa, { foreignKey: 'mesaId' })
  declare mesa: BelongsTo<typeof Mesa>

  @hasMany(() => Pedido)
  declare pedidos: HasMany<typeof Pedido>

  // Business methods
  get displayName() {
    return this.name || `Comanda ${this.number}`
  }

  async occupy() {
    this.active = true
    await this.save()

    if (this.mesaId) {
      const mesa = await Mesa.find(this.mesaId)
      if (mesa) {
        mesa.status = 'occupied'
        await mesa.save()
      }
    }
  }

  async free() {
    this.active = false
    await this.save()

    if (this.mesaId) {
      // Se não houver outras comandas ativas na mesma mesa, liberar a mesa
      const activeCount = await Comanda.query()
        .where('mesa_id', this.mesaId)
        .where('active', true)
        .count('* as total')
      const total = Number(activeCount[0].$extras.total || 0)
      if (total === 0) {
        const mesa = await Mesa.find(this.mesaId)
        if (mesa) {
          mesa.status = 'available'
          await mesa.save()
        }
      }
    }
  }

  async getCurrentPedido() {
    return Pedido.query()
      .where('comanda_id', this.id)
      .whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .orderBy('created_at', 'desc')
      .first()
  }

  async getActivePedidos() {
    return await Pedido.query()
      .where('comanda_id', this.id)
      .whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .orderBy('created_at', 'desc')
  }

  async checkAndCloseIfCompleted() {
    await this.load('pedidos' as any) // Correctly load the 'orders' relationship
    const hasUnpaidPedido = this.pedidos.some((pedido) => pedido.status !== 'paid')

    if (!hasUnpaidPedido && this.active) {
      this.active = false
      await this.save()
    }
  }

  // Scopes
  static activeTables() {
    return this.query().where('active', true)
  }

  static orderByNumber() {
    return this.query().orderByRaw('CAST(number AS INTEGER) ASC')
  }
}
