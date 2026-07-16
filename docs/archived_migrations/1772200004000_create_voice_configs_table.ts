import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'voice_configs'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.text('openai_api_key_encrypted').notNullable()
      table.boolean('enabled').notNullable().defaultTo(false)
      table.string('whisper_model', 50).nullable()
      table.string('llm_model', 50).nullable()
      table.timestamps(true, true)

      table.index(['empresa_id', 'enabled'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
