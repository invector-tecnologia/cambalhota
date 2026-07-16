import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'

export default class EntityProcessingStatus extends BaseModel {
  static table = 'tavolo.entity_processing_status'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column()
  declare entityType: string

  @column()
  declare entityId: number

  @column()
  declare status: 'pending' | 'partial' | 'complete' | 'failed'

  @column()
  declare failedRules: Array<{ ruleName: string; error: string }> | null

  @column()
  declare completedRules: string[] | null

  @column.dateTime()
  declare lastProcessedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  // Methods
  /**
   * Marca como pendente
   */
  async markAsPending() {
    this.status = 'pending'
    this.failedRules = null
    this.completedRules = null
    await this.save()
  }

  /**
   * Marca como completo
   */
  async markAsComplete(completedRules: string[] = []) {
    this.status = 'complete'
    this.completedRules = completedRules
    this.failedRules = null
    this.lastProcessedAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca como parcial
   */
  async markAsPartial(
    completedRules: string[] = [],
    failedRules: Array<{ ruleName: string; error: string }> = []
  ) {
    this.status = 'partial'
    this.completedRules = completedRules
    this.failedRules = failedRules
    this.lastProcessedAt = DateTime.now()
    await this.save()
  }

  /**
   * Marca como falho
   */
  async markAsFailed(failedRules: Array<{ ruleName: string; error: string }> = []) {
    this.status = 'failed'
    this.failedRules = failedRules
    this.completedRules = null
    this.lastProcessedAt = DateTime.now()
    await this.save()
  }

  /**
   * Adiciona regra à lista de completadas
   */
  async addCompletedRule(ruleName: string) {
    if (!this.completedRules) {
      this.completedRules = []
    }
    if (!this.completedRules.includes(ruleName)) {
      this.completedRules.push(ruleName)
    }
    await this.save()
  }

  /**
   * Adiciona regra à lista de falhadas
   */
  async addFailedRule(ruleName: string, error: string) {
    if (!this.failedRules) {
      this.failedRules = []
    }
    // Remove se já existir e re-adiciona
    this.failedRules = this.failedRules.filter((r) => r.ruleName !== ruleName)
    this.failedRules.push({ ruleName, error })
    await this.save()
  }

  /**
   * Obtém sumário do status
   */
  getSummary() {
    const completed = this.completedRules?.length || 0
    const failed = this.failedRules?.length || 0
    return {
      status: this.status,
      completedCount: completed,
      failedCount: failed,
      totalRules: completed + failed,
      failedRulesNames: this.failedRules?.map((r) => r.ruleName) || [],
      completedRulesNames: this.completedRules || [],
    }
  }
}
