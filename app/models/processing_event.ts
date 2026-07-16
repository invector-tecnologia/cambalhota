import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import ProcessingRule from './processing_rule.js'
import User from './user.js'

export default class ProcessingEvent extends BaseModel {
  static table = 'tavolo.processing_events'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare processingRuleId: number

  @column()
  declare entityType: string

  @column()
  declare entityId: number

  @column()
  declare ruleName: string

  @column()
  declare status: 'pending' | 'processing' | 'success' | 'failed' | 'reprocessing'

  @column()
  declare errorMessage: string | null

  @column()
  declare errorStackTrace: string | null

  @column()
  declare resultData: Record<string, any> | null

  @column()
  declare executedBy: number | null

  @column.dateTime()
  declare executedAt: DateTime | null

  @column()
  declare reprocessAttempts: number

  @column.dateTime()
  declare lastReprocessAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => ProcessingRule, { foreignKey: 'processingRuleId' })
  declare processingRule: BelongsTo<typeof ProcessingRule>

  @belongsTo(() => User, { foreignKey: 'executedBy' })
  declare executedByUser: BelongsTo<typeof User>

  // Methods
  /**
   * Marca como processando
   */
  async markAsProcessing() {
    this.status = 'processing'
    this.executedAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca como sucesso
   */
  async markAsSuccess(resultData?: Record<string, any>) {
    this.status = 'success'
    this.resultData = resultData || null
    this.errorMessage = null
    this.executedAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca como falha
   */
  async markAsFailed(error: Error | string, stackTrace?: string) {
    this.status = 'failed'
    this.errorMessage = typeof error === 'string' ? error : error.message
    this.errorStackTrace = stackTrace || (typeof error !== 'string' ? error.stack || null : null)
    this.executedAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca para reprocessamento
   */
  async markAsReprocessing() {
    this.status = 'reprocessing'
    this.reprocessAttempts += 1
    this.lastReprocessAt = DateTime.now()
    await this.save()
  }

  /**
   * Obtém o entity (Pedido, Venda, Comanda, etc)
   */
  async getEntity() {
    // Isso será resolvido em runtime pelo ProcessingEngine
    // Aqui retornamos referência para que seja carregado dinamicamente
    return {
      type: this.entityType,
      id: this.entityId,
    }
  }
}
