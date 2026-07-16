import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: empresas
// Model: Empresa (app/models/empresa.ts)
export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Dados básicos da empresa
      table.string('name').notNullable()
      table.string('trade_name').nullable() // Nome fantasia
      table.string('cnpj', 18).unique().notNullable()
      table.string('ie').nullable() // Inscrição estadual
      table.string('im').nullable() // Inscrição municipal

      // Endereço
      table.string('address').notNullable()
      table.string('address_number').nullable()
      table.string('address_complement').nullable()
      table.string('neighborhood').notNullable()
      table.string('city').notNullable()
      table.string('state', 2).notNullable()
      table.string('zip_code', 9).notNullable()

      // Contato
      table.string('phone').nullable()
      table.string('email').nullable()
      table.string('website').nullable()

      // Status
      table.boolean('active').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
