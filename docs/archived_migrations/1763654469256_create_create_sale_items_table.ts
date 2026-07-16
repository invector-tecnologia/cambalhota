import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: venda_itens
// Nota: Relacionamento menu_item_id → CardapioProduct (tabela cardapio_products)
export default class extends BaseSchema {
  protected tableName = 'venda_itens'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('sale_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vendas')
        .onDelete('CASCADE')
      table
        .integer('menu_item_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('cardapio_produtos')
        .onDelete('CASCADE')
      table
        .integer('order_item_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('pedido_itens')
        .onDelete('SET NULL')
      table.string('item_name').notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('unit_cost', 10, 2).notNullable().defaultTo(0)
      table.integer('quantity').notNullable().defaultTo(1)
      table.decimal('subtotal', 10, 2).notNullable().defaultTo(0)
      table.decimal('cost_total', 10, 2).notNullable().defaultTo(0)
      table.decimal('profit', 10, 2).notNullable().defaultTo(0)
      table.decimal('profit_margin', 5, 2).notNullable().defaultTo(0)
      table.text('special_instructions').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Índices
      table.index(['sale_id'])
      table.index(['menu_item_id'])
      table.index(['order_item_id'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
