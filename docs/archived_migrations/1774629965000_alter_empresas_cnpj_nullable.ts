import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('cnpj', 18).nullable().alter()
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('cnpj', 18).notNullable().alter()
    })
  }
}
