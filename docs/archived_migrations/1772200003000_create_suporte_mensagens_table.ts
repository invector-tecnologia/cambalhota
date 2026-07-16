import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suporte_mensagens'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('ticket_id').unsigned().notNullable()
      table.integer('sender_user_id').unsigned().nullable()
      table.string('sender_tipo', 20).notNullable()
      table.text('mensagem').notNullable()
      table.dateTime('lida_usuario_em').nullable()
      table.dateTime('lida_admin_em').nullable()
      table.timestamps(true, true)

      table
        .foreign('ticket_id')
        .references('id')
        .inTable('suporte_solicitacoes')
        .onDelete('CASCADE')
      table.foreign('sender_user_id').references('id').inTable('users').onDelete('SET NULL')

      table.index(['ticket_id', 'created_at'])
      table.index(['sender_tipo'])
      table.index(['lida_usuario_em'])
      table.index(['lida_admin_em'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
