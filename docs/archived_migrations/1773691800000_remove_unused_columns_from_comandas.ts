import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comandas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('location')
      table.dropColumn('capacity')
      table.dropColumn('status')
      table.dropColumn('sort_order')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('location', 100).nullable()
      table.integer('capacity').unsigned().notNullable().defaultTo(4)
      table.string('status').notNullable().defaultTo('available')
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)
    })
  }
}
