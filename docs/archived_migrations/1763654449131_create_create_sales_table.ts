import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vendas'

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
        .integer('order_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('pedidos')
        .onDelete('SET NULL')
      table
        .integer('table_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('comandas')
        .onDelete('SET NULL')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('sale_number', 20).notNullable()
      table.enum('payment_method', ['cash', 'card', 'pix', 'split']).notNullable()
      table.decimal('subtotal', 10, 2).notNullable().defaultTo(0)
      table.decimal('discount', 10, 2).notNullable().defaultTo(0)
      table.decimal('tax', 10, 2).notNullable().defaultTo(0)
      table.decimal('total', 10, 2).notNullable().defaultTo(0)
      table.decimal('cost_total', 10, 2).notNullable().defaultTo(0)
      table.decimal('profit', 10, 2).notNullable().defaultTo(0)
      table.decimal('profit_margin', 5, 2).notNullable().defaultTo(0)
      table.text('notes').nullable()
      table.timestamp('sale_date').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Índices
      table.index(['company_id'])
      table.index(['order_id'])
      table.index(['sale_number'])
      table.index(['sale_date'])
      table.index(['payment_method'])
      table.unique(['company_id', 'sale_number'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
