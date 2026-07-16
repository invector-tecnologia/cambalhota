import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FiscalConfig from './fiscal_config.js'
import Venda from './venda.js'
import { randomUUID } from 'node:crypto'

export type FiscalNoteStatus = 'PENDING' | 'AUTHORIZED' | 'CANCELLED' | 'CONTINGENCY' | 'ERROR'

export default class FiscalNote extends BaseModel {
  static table = 'tavolo.fiscal_notes'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'venda_id' })
  declare vendaId: number

  @column({ columnName: 'fiscal_config_id' })
  declare fiscalConfigId: string

  @column()
  declare status: FiscalNoteStatus

  @column({ columnName: 'xml_content' })
  declare xmlContent: string | null

  @column({ columnName: 'access_key' })
  declare accessKey: string | null

  @column({ columnName: 'protocol_number' })
  declare protocolNumber: string | null

  @column({ columnName: 'danfe_url' })
  declare danfeUrl: string | null

  @column({ columnName: 'error_log' })
  declare errorLog: Record<string, any> | null

  @column()
  declare uf: string | null

  @column()
  declare numero: number | null

  @column()
  declare serie: number

  @column({ columnName: 'attempt_count' })
  declare attemptCount: number

  @column({ columnName: 'last_attempt_at' })
  declare lastAttemptAt: DateTime | null

  @column({ columnName: 'last_attempt_error' })
  declare lastAttemptError: string | null

  @column({ columnName: 'is_retryable' })
  declare isRetryable: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => FiscalConfig, {
    foreignKey: 'fiscalConfigId',
  })
  declare fiscalConfig: BelongsTo<typeof FiscalConfig>

  @belongsTo(() => Venda, {
    foreignKey: 'vendaId',
  })
  declare venda: BelongsTo<typeof Venda>

  static boot() {
    super.boot()

    this.before('create', async (model) => {
      if (!model.id) {
        model.id = randomUUID()
      }
    })
  }

  /**
   * Marca a nota como autorizada
   */
  async markAsAuthorized(accessKey: string, protocolNumber: string) {
    this.status = 'AUTHORIZED'
    this.accessKey = accessKey
    this.protocolNumber = protocolNumber
    this.attemptCount = 0
    this.lastAttemptAt = null
    this.lastAttemptError = null
    await this.save()
  }

  /**
   * Marca a nota como com erro e registra tentativa
   */
  async markAsError(errorDetails: Record<string, any>) {
    const now = DateTime.now()
    this.status = 'ERROR'
    this.errorLog = errorDetails
    this.attemptCount = (this.attemptCount || 0) + 1
    this.lastAttemptAt = now
    this.lastAttemptError =
      errorDetails.message || errorDetails.error || JSON.stringify(errorDetails)

    // Se já tentou 5 vezes, não tenta mais automaticamente
    if (this.attemptCount >= 5) {
      this.isRetryable = false
    }

    await this.save()
  }

  /**
   * Marca a nota para retry (volta para PENDING)
   */
  async markForRetry() {
    if (!this.isRetryable) {
      throw new Error('Esta nota não é mais elegível para retry')
    }
    this.status = 'PENDING'
    this.errorLog = null
    await this.save()
  }

  /**
   * Marca a nota como em contingência
   */
  async markAsContingency() {
    this.status = 'CONTINGENCY'
    await this.save()
  }
}
