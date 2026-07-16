import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_quick_actions'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('action_key', 100).notNullable() // Ex: 'new_order', 'new_product', etc
      table.boolean('enabled').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Índices
      table.unique(['user_id', 'action_key'])
      table.index('user_id')
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
