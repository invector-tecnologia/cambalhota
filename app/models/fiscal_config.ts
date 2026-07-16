import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import db from '@adonisjs/lucid/services/db'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import FiscalNote from './fiscal_note.js'
import { randomUUID } from 'node:crypto'
import FiscalProvider from '#providers/fiscal_provider'

export default class FiscalConfig extends BaseModel {
  static table = 'tavolo.fiscal_configs'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'establishment_id' })
  declare establishmentId: number

  @column({ columnName: 'certificate_path' })
  declare certificatePath: string

  @column({ columnName: 'certificate_password' })
  declare certificatePassword: string

  @column({ columnName: 'csc_token' })
  declare cscToken: string

  @column({ columnName: 'csc_id' })
  declare cscId: string

  @column({ columnName: 'is_homologation' })
  declare isHomologation: boolean

  @column({ columnName: 'next_nfe_number' })
  declare nextNfeNumber: number

  @column({ columnName: 'state_override' })
  declare stateOverride: string | null

  @column()
  declare autorizador: string | null

  @column()
  declare serie: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Empresa, {
    foreignKey: 'establishmentId',
  })
  declare empresa: BelongsTo<typeof Empresa>

  @hasMany(() => FiscalNote, {
    foreignKey: 'fiscalConfigId',
  })
  declare fiscalNotes: HasMany<typeof FiscalNote>

  static boot() {
    super.boot()

    this.before('create', async (model) => {
      if (!model.id) {
        model.id = randomUUID()
      }
    })
  }

  @beforeSave()
  static async encryptCertificatePassword(model: FiscalConfig) {
    if (!model.$dirty.certificatePassword || !model.certificatePassword) {
      return
    }

    if (FiscalConfig.isEncrypted(model.certificatePassword)) {
      return
    }

    model.certificatePassword = FiscalProvider.encryptSensitiveData(model.certificatePassword)
  }

  static isEncrypted(value: string): boolean {
    return /^[0-9a-f]{32}:[0-9a-f]+$/i.test(value)
  }

  getDecryptedCertificatePassword(): string {
    if (!this.certificatePassword) {
      return this.certificatePassword
    }

    if (!FiscalConfig.isEncrypted(this.certificatePassword)) {
      return this.certificatePassword
    }

    try {
      return FiscalProvider.decryptSensitiveData(this.certificatePassword)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Falha ao descriptografar senha do certificado: ${errorMessage}`)
    }
  }

  /**
   * Incrementa o número da próxima NF-e
   */
  static async incrementNextNfeNumber(establishmentId: number): Promise<number> {
    const result = await db.rawQuery(
      `UPDATE fiscal_configs
       SET next_nfe_number = next_nfe_number + 1
       WHERE establishment_id = ?
       RETURNING next_nfe_number`,
      [establishmentId]
    )

    const nextNumber = result?.rows?.[0]?.next_nfe_number
    if (!nextNumber) {
      throw new Error('Falha ao reservar número da NF-e')
    }

    return Number(nextNumber) - 1
  }

  /**
   * Resolve UF efetiva (override ou da empresa)
   */
  async getEffectiveState(): Promise<string> {
    if (this.stateOverride) {
      return this.stateOverride.toUpperCase()
    }

    // @ts-ignore - Relação empresa
    await this.load('empresa' as any)
    if (!this.empresa || !this.empresa.state) {
      throw new Error('Estado não configurado no estabelecimento')
    }

    return this.empresa.state.toUpperCase()
  }
}
