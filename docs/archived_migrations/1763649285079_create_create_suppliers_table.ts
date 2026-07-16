import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: fornecedores
// Model: Supplier (app/models/supplier.ts)
export default class extends BaseSchema {
  protected tableName = 'fornecedores'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamento com empresa
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')

      // Dados básicos
      table.string('name').notNullable()
      table.string('trade_name').nullable()
      table.string('document').notNullable() // CNPJ ou CPF
      table.enum('document_type', ['cpf', 'cnpj']).notNullable()
      table.string('ie').nullable() // Inscrição estadual

      // Endereço
      table.string('address').nullable()
      table.string('address_number').nullable()
      table.string('address_complement').nullable()
      table.string('neighborhood').nullable()
      table.string('city').nullable()
      table.string('state', 2).nullable()
      table.string('zip_code', 9).nullable()

      // Contato
      table.string('phone').nullable()
      table.string('email').nullable()
      table.string('contact_person').nullable() // Pessoa de contato

      // Informações comerciais
      table.text('notes').nullable() // Observações
      table
        .enum('payment_terms', ['vista', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias'])
        .defaultTo('vista')

      // Status
      table.boolean('active').defaultTo(true)

      // Auditoria
      table.integer('created_by').unsigned().nullable().references('users.id')
      table.integer('updated_by').unsigned().nullable().references('users.id')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['company_id', 'document'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
