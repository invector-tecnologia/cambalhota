import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'

export type AssinaturaStatus = 'trial' | 'active' | 'past_due' | 'canceled'

export default class AssinaturaEmpresa extends BaseModel {
  static table = 'tavolo.assinaturas_empresas'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'empresa_id' })
  declare empresaId: number

  @column()
  declare plano: string

  @column()
  declare status: AssinaturaStatus

  @column({ columnName: 'valor_mensal' })
  declare valorMensal: number

  @column()
  declare moeda: string

  @column.date({ columnName: 'proximo_vencimento' })
  declare proximoVencimento: DateTime | null

  @column.date({ columnName: 'ultimo_pagamento_em' })
  declare ultimoPagamentoEm: DateTime | null

  @column({ columnName: 'dias_tolerancia' })
  declare diasTolerancia: number

  @column({ columnName: 'gateway_ref' })
  declare gatewayRef: string | null

  @column()
  declare observacoes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>
}
