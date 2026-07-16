import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entity_processing_status'

  async up() {
    if (!(await this.schema.hasTable(this.tableName))) {
      await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.string('entity_type').notNullable()
      table.integer('entity_id').unsigned().notNullable()
      table
        .enum('status', ['pending', 'partial', 'complete', 'failed'])
        .defaultTo('pending')
        .notNullable()
      table.json('failed_rules').nullable().comment('Array de {ruleName, error}')
      table.json('completed_rules').nullable().comment('Array de nomes de regras completadas')
      table.dateTime('last_processed_at').nullable()

      table.timestamps(true, true)

      table.foreign('empresa_id').references('id').inTable('empresas').onDelete('CASCADE')
      table.unique(['entity_type', 'entity_id'])
      table.index(['empresa_id'])
      table.index(['status'])
      table.index(['entity_type'])
    })
    }
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
