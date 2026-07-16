import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SuporteSolicitacao from './suporte_solicitacao.js'
import User from './user.js'

export type SuporteSenderTipo = 'usuario' | 'admin' | 'sistema'

export default class SuporteMensagem extends BaseModel {
  static table = 'tavolo.suporte_mensagens'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'ticket_id' })
  declare ticketId: number

  @column({ columnName: 'sender_user_id' })
  declare senderUserId: number | null

  @column({ columnName: 'sender_tipo' })
  declare senderTipo: SuporteSenderTipo

  @column()
  declare mensagem: string

  @column.dateTime({ columnName: 'lida_usuario_em' })
  declare lidaUsuarioEm: DateTime | null

  @column.dateTime({ columnName: 'lida_admin_em' })
  declare lidaAdminEm: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SuporteSolicitacao, { foreignKey: 'ticketId' })
  declare ticket: BelongsTo<typeof SuporteSolicitacao>

  @belongsTo(() => User, { foreignKey: 'senderUserId' })
  declare senderUser: BelongsTo<typeof User>
}
