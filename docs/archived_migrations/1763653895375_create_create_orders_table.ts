import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pedidos'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable()
      table.integer('table_id').unsigned().nullable() // Nullable para delivery/takeout
      table.integer('user_id').unsigned().notNullable() // Garçom/Atendente
      table.string('order_number', 20).notNullable()
      table.string('customer_name', 100).nullable()
      table.string('customer_phone', 20).nullable()
      table.string('type').notNullable().defaultTo('dine_in') // dine_in, takeout, delivery
      table.string('status').notNullable().defaultTo('pending') // pending, confirmed, preparing, ready, served, cancelled, paid
      table.decimal('subtotal', 10, 2).notNullable().defaultTo(0)
      table.decimal('discount', 10, 2).notNullable().defaultTo(0)
      table.decimal('service_charge', 10, 2).notNullable().defaultTo(0)
      table.decimal('total', 10, 2).notNullable().defaultTo(0)
      table.text('notes').nullable()
      table.text('delivery_address').nullable()
      table.timestamp('confirmed_at').nullable()
      table.timestamp('prepared_at').nullable()
      table.timestamp('served_at').nullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('cancelled_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('company_id').references('empresas.id').onDelete('CASCADE')
      table.foreign('table_id').references('comandas.id').onDelete('SET NULL')
      table.foreign('user_id').references('users.id').onDelete('RESTRICT')

      // Indexes
      table.index(['company_id', 'status'])
      table.index(['company_id', 'created_at'])
      table.index(['table_id', 'status'])
      table.unique(['company_id', 'order_number'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
