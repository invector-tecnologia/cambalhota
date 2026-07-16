import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('cpf', 14).nullable().after('cnpj')
      table.enum('document_type', ['cpf', 'cnpj']).defaultTo('cnpj').after('cpf')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cpf')
      table.dropColumn('document_type')
    })
  }
}
