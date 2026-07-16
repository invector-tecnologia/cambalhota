import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suporte_solicitacoes'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('protocolo', 40).nullable().after('id')
      table.integer('opened_by_user_id').unsigned().nullable().after('empresa_id')
      table.dateTime('cancelado_em').nullable().after('resolvido_em')
      table.dateTime('solucao_sugerida_em').nullable().after('cancelado_em')
      table.dateTime('ultima_interacao_usuario_em').nullable().after('solucao_sugerida_em')
      table.dateTime('ultima_interacao_admin_em').nullable().after('ultima_interacao_usuario_em')
      table
        .integer('admin_no_reply_streak')
        .notNullable()
        .defaultTo(0)
        .after('ultima_interacao_admin_em')
      table.string('resolvido_por', 30).nullable().after('admin_no_reply_streak')
      table.text('resolucao_motivo').nullable().after('resolvido_por')

      table.foreign('opened_by_user_id').references('id').inTable('users').onDelete('SET NULL')
      table.unique(['protocolo'])
      table.index(['opened_by_user_id'])
      table.index(['status', 'updated_at'])
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'updated_at'])
      table.dropIndex(['opened_by_user_id'])
      table.dropUnique(['protocolo'])
      table.dropForeign(['opened_by_user_id'])

      table.dropColumn('resolucao_motivo')
      table.dropColumn('resolvido_por')
      table.dropColumn('admin_no_reply_streak')
      table.dropColumn('ultima_interacao_admin_em')
      table.dropColumn('ultima_interacao_usuario_em')
      table.dropColumn('solucao_sugerida_em')
      table.dropColumn('cancelado_em')
      table.dropColumn('opened_by_user_id')
      table.dropColumn('protocolo')
    })
  }
}
