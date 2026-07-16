import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import { encrypt, decrypt } from '../helpers/voice_crypto.js'
import env from '#start/env'

export default class VoiceConfig extends BaseModel {
  static table = 'tavolo.voice_configs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number

  @column({ columnName: 'openai_api_key_encrypted' })
  declare openaiApiKeyEncrypted: string

  @column()
  declare enabled: boolean

  @column()
  declare whisperModel: string | null

  @column()
  declare llmModel: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  /**
   * Seta a API key criptografada
   */
  setApiKey(plainKey: string): void {
    this.openaiApiKeyEncrypted = encrypt(plainKey, env.get('APP_KEY'))
  }

  /**
   * Obtém a API key descriptografada (apenas para uso server-side)
   */
  getApiKey(): string {
    return decrypt(this.openaiApiKeyEncrypted, env.get('APP_KEY'))
  }

  /**
   * Retorna a key mascarada para exibição (sk-...xxxx)
   */
  get maskedApiKey(): string {
    try {
      const key = this.getApiKey()
      if (key.length <= 8) return '****'
      return `${key.substring(0, 5)}...${key.substring(key.length - 4)}`
    } catch {
      return '****'
    }
  }
}
