import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'processing_events'

  async up() {
    if (!(await this.schema.hasTable(this.tableName))) {
      await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.integer('processing_rule_id').unsigned().notNullable()
      table.string('entity_type').notNullable().comment('Pedido, Venda, Comanda, Nfe, etc')
      table.integer('entity_id').unsigned().notNullable()
      table.string('rule_name').notNullable()
      table
        .enum('status', ['pending', 'processing', 'success', 'failed', 'reprocessing'])
        .defaultTo('pending')
        .notNullable()
      table.text('error_message').nullable()
      table.text('error_stack_trace').nullable()
      table.json('result_data').nullable()
      table.integer('executed_by').unsigned().nullable()
      table.dateTime('executed_at').nullable()
      table.integer('reprocess_attempts').unsigned().defaultTo(0).notNullable()
      table.dateTime('last_reprocess_at').nullable()

      table.timestamps(true, true)

      table.foreign('empresa_id').references('id').inTable('empresas').onDelete('CASCADE')
      table
        .foreign('processing_rule_id')
        .references('id')
        .inTable('processing_rules')
        .onDelete('CASCADE')
      table.foreign('executed_by').references('id').inTable('users').onDelete('SET NULL')

      table.index(['empresa_id'])
      table.index(['entity_type', 'entity_id'])
      table.index(['status'])
      table.index(['processing_rule_id'])
      table.index(['created_at'])
      table.index(['status', 'entity_type'])
    })
    }
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
