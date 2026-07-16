import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: cardapios_virtuais
// Model: CardapioVirtual (app/models/cardapio_virtual.ts)
export default class extends BaseSchema {
  protected tableName = 'cardapios_virtuais'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('company_id')
        .unsigned()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.string('title', 200).notNullable()
      table.text('description').nullable()
      table.string('slug', 255).notNullable().unique()
      table.enum('status', ['draft', 'published']).defaultTo('draft')
      table.string('theme', 50).defaultTo('default')
      table.json('settings').nullable()
      table.timestamp('published_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
