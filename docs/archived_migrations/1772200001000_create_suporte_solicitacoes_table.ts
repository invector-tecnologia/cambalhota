import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suporte_solicitacoes'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().nullable()
      table.string('nome_contato', 120).notNullable()
      table.string('email_contato', 160).notNullable()
      table.string('assunto', 180).notNullable()
      table.text('mensagem').notNullable()
      table.string('categoria', 30).notNullable().defaultTo('duvida')
      table.string('prioridade', 20).notNullable().defaultTo('media')
      table.string('status', 30).notNullable().defaultTo('aberto')
      table.string('canal', 30).notNullable().defaultTo('painel')
      table.string('responsavel', 120).nullable()
      table.dateTime('resolvido_em').nullable()
      table.timestamps(true, true)

      table.foreign('empresa_id').references('id').inTable('empresas').onDelete('SET NULL')
      table.index(['empresa_id'])
      table.index(['status'])
      table.index(['prioridade'])
      table.index(['created_at'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
