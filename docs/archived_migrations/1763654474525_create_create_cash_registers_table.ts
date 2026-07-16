import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'caixa_registros'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('company_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.date('register_date').notNullable()
      table.decimal('opening_balance', 10, 2).notNullable().defaultTo(0)
      table.decimal('closing_balance', 10, 2).nullable()
      table.decimal('cash_sales', 10, 2).notNullable().defaultTo(0)
      table.decimal('card_sales', 10, 2).notNullable().defaultTo(0)
      table.decimal('pix_sales', 10, 2).notNullable().defaultTo(0)
      table.decimal('total_sales', 10, 2).notNullable().defaultTo(0)
      table.decimal('total_cost', 10, 2).notNullable().defaultTo(0)
      table.decimal('total_profit', 10, 2).notNullable().defaultTo(0)
      table.integer('total_transactions').notNullable().defaultTo(0)
      table.decimal('average_ticket', 10, 2).notNullable().defaultTo(0)
      table.enum('status', ['open', 'closed']).notNullable().defaultTo('open')
      table.timestamp('opened_at').notNullable()
      table.timestamp('closed_at').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Índices
      table.index(['company_id'])
      table.index(['user_id'])
      table.index(['register_date'])
      table.index(['status'])
      table.unique(['company_id', 'register_date'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
