import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Empresa from './empresa.js'
import User from './user.js'
import SuporteMensagem from './suporte_mensagem.js'

export type SuporteStatus =
  | 'novo'
  | 'aberto'
  | 'em_andamento'
  | 'aguardando_usuario'
  | 'solucao_sugerida'
  | 'resolvido'
  | 'fechado'
  | 'cancelado'

export type SuportePrioridade = 'baixa' | 'media' | 'alta' | 'urgente'

export default class SuporteSolicitacao extends BaseModel {
  static table = 'tavolo.suporte_solicitacoes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'empresa_id' })
  declare empresaId: number | null

  @column({ columnName: 'protocolo' })
  declare protocolo: string

  @column({ columnName: 'opened_by_user_id' })
  declare openedByUserId: number | null

  @column({ columnName: 'nome_contato' })
  declare nomeContato: string

  @column({ columnName: 'email_contato' })
  declare emailContato: string

  @column()
  declare assunto: string

  @column()
  declare mensagem: string

  @column()
  declare categoria: string

  @column()
  declare prioridade: SuportePrioridade

  @column()
  declare status: SuporteStatus

  @column()
  declare canal: string

  @column()
  declare responsavel: string | null

  @column.dateTime({ columnName: 'resolvido_em' })
  declare resolvidoEm: DateTime | null

  @column.dateTime({ columnName: 'cancelado_em' })
  declare canceladoEm: DateTime | null

  @column.dateTime({ columnName: 'solucao_sugerida_em' })
  declare solucaoSugeridaEm: DateTime | null

  @column.dateTime({ columnName: 'ultima_interacao_usuario_em' })
  declare ultimaInteracaoUsuarioEm: DateTime | null

  @column.dateTime({ columnName: 'ultima_interacao_admin_em' })
  declare ultimaInteracaoAdminEm: DateTime | null

  @column({ columnName: 'admin_no_reply_streak' })
  declare adminNoReplyStreak: number

  @column({ columnName: 'resolvido_por' })
  declare resolvidoPor: string | null

  @column({ columnName: 'resolucao_motivo' })
  declare resolucaoMotivo: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Empresa, { foreignKey: 'empresaId' })
  declare empresa: BelongsTo<typeof Empresa>

  @belongsTo(() => User, { foreignKey: 'openedByUserId' })
  declare openedByUser: BelongsTo<typeof User>

  @hasMany(() => SuporteMensagem, { foreignKey: 'ticketId' })
  declare mensagens: HasMany<typeof SuporteMensagem>
}
