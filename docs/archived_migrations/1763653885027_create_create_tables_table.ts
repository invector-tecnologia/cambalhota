import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: comandas
// Model: Comanda (app/models/comanda.ts)
export default class extends BaseSchema {
  protected tableName = 'comandas'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable()
      table.string('number', 10).notNullable()
      table.string('name', 100).nullable()
      table.string('location', 100).nullable() // Área, andar, etc
      table.integer('capacity').unsigned().notNullable().defaultTo(4)
      table.string('status').notNullable().defaultTo('available') // available, occupied, reserved, maintenance
      table.text('notes').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('company_id').references('empresas.id').onDelete('CASCADE')

      // Indexes
      table.index(['company_id', 'status'])
      table.unique(['company_id', 'number'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
