import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mesas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.enum('status', ['available', 'occupied', 'reserved', 'maintenance']).notNullable().defaultTo('available').after('location')
      table.integer('capacity').unsigned().nullable().after('status')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('capacity')
    })
  }
}
