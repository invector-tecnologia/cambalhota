import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mesas'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.string('number', 20).notNullable()
      table.string('name', 100).nullable()
      table.string('location', 100).nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('empresa_id').references('empresas.id').onDelete('CASCADE')

      // Indexes
      table.index(['empresa_id'])
      table.unique(['empresa_id', 'number'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
