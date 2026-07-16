import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('theme', 50).defaultTo('Light').notNullable()
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('theme')
    })
  }
}
