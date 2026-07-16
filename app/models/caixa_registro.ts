import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from '#models/empresa'
import User from '#models/user'
import Venda from '#models/venda'

function nowInTimezone(timezone?: string): DateTime {
  return timezone ? DateTime.now().setZone(timezone) : DateTime.now()
}

export default class CaixaRegistro extends BaseModel {
  static table = 'tavolo.caixa_registros'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare userId: number

  @column.date()
  declare registerDate: DateTime

  @column()
  declare openingBalance: number

  @column()
  declare closingBalance: number | null

  @column()
  declare cashSales: number

  @column()
  declare cardSales: number

  @column()
  declare pixSales: number

  @column()
  declare totalSales: number

  @column()
  declare totalCost: number

  @column()
  declare totalProfit: number

  @column()
  declare totalTransactions: number

  @column()
  declare averageTicket: number

  @column()
  declare status: 'open' | 'closed'

  @column.dateTime()
  declare openedAt: DateTime

  @column.dateTime()
  declare closedAt: DateTime | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  // Métodos de negócio
  static async openRegister(
    empresaId: number,
    userId: number,
    openingBalance = 0,
    timezone?: string
  ): Promise<CaixaRegistro> {
    const today = nowInTimezone(timezone).toISODate()

    // Bloqueia se houver qualquer caixa aberto na empresa (independente da data)
    const openRegister = await CaixaRegistro.query()
      .where('empresa_id', empresaId)
      .where('status', 'open')
      .first()

    if (openRegister) {
      throw new Error('Já existe um caixa aberto')
    }

    // Se existir caixa do dia fechado, reabre o mesmo registro
    const todayRegister = await CaixaRegistro.query()
      .where('empresa_id', empresaId)
      .where('register_date', today!)
      .first()

    if (todayRegister) {
      todayRegister.status = 'open'
      todayRegister.openedAt = nowInTimezone(timezone)
      await todayRegister.save()
      return todayRegister
    }

    return await CaixaRegistro.create({
      empresaId,
      userId,
      registerDate: DateTime.fromISO(today!, { zone: timezone }),
      openingBalance,
      status: 'open',
      openedAt: nowInTimezone(timezone),
    })
  }

  async updateSalesData(): Promise<void> {
    const today = this.registerDate.toISODate()

    const sales = await Venda.query()
      .where('empresa_id', this.empresaId)
      .whereRaw('DATE(sale_date) = ?', [today!])

    this.cashSales = sales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0)
    this.cardSales = sales
      .filter((s) => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + s.total, 0)
    this.pixSales = sales
      .filter((s) => s.paymentMethod === 'pix')
      .reduce((sum, s) => sum + s.total, 0)

    this.totalSales = this.cashSales + this.cardSales + this.pixSales
    this.totalCost = sales.reduce((sum, s) => sum + s.costTotal, 0)
    this.totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)
    this.totalTransactions = sales.length
    this.averageTicket = this.totalTransactions > 0 ? this.totalSales / this.totalTransactions : 0
  }

  async closeRegister(closingBalance: number, notes?: string, timezone?: string): Promise<void> {
    if (this.status === 'closed') {
      throw new Error('Caixa já está fechado')
    }

    await this.updateSalesData()

    this.closingBalance = closingBalance
    this.status = 'closed'
    this.closedAt = nowInTimezone(timezone)
    if (notes) this.notes = notes

    await this.save()
  }

  get statusBadge() {
    return this.status === 'open'
      ? { text: 'Aberto', class: 'bg-green-100 text-green-800' }
      : { text: 'Fechado', class: 'bg-red-100 text-red-800' }
  }

  get expectedCashBalance(): number {
    return this.openingBalance + this.cashSales
  }

  get cashDifference(): number {
    return this.closingBalance ? this.closingBalance - this.expectedCashBalance : 0
  }

  get profitMargin(): number {
    return this.totalSales > 0 ? (this.totalProfit / this.totalSales) * 100 : 0
  }
}
