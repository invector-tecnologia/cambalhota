import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import ProcessingEvent from './processing_event.js'

export default class ProcessingRule extends BaseModel {
  static table = 'tavolo.processing_rules'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare name: string

  @column()
  declare type:
    | 'stock_reservation'
    | 'stock_deduction'
    | 'discount_apply'
    | 'nfe_emit'
    | 'comanda_closing'
    | 'pedido_status_sync'
    | 'custom'

  @column()
  declare priority: number

  @column()
  declare enabled: boolean

  @column()
  declare handler: string

  @column()
  declare config: Record<string, any> | null

  @column()
  declare appliedTo: 'pedido' | 'venda' | 'comanda' | 'nfe' | 'geral'

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @hasMany(() => ProcessingEvent, { foreignKey: 'processingRuleId' })
  declare processingEvents: HasMany<typeof ProcessingEvent>

  // Methods
  /**
   * Obtém o service e método do handler
   */
  getHandler(): { serviceName: string; methodName: string } {
    const [serviceName, methodName] = this.handler.split('.')
    return { serviceName, methodName }
  }

  /**
   * Obtém histórico de execuções desta regra
   */
  async getExecutionHistory(limit: number = 10) {
    return ProcessingEvent.query()
      .where('processingRuleId', this.id)
      .orderBy('createdAt', 'desc')
      .limit(limit)
  }

  /**
   * Obtém estatísticas de execução
   */
  async getExecutionStats() {
    const events = await ProcessingEvent.query().where('processingRuleId', this.id)

    const stats = {
      total: events.length,
      success: events.filter((e) => e.status === 'success').length,
      failed: events.filter((e) => e.status === 'failed').length,
      successRate:
        events.length > 0
          ? (events.filter((e) => e.status === 'success').length / events.length) * 100
          : 0,
    }

    return stats
  }
}
