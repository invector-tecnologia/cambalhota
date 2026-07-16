import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: pedido_itens
// Nota: Relacionamento menu_item_id → CardapioProduct (tabela cardapio_products)
export default class extends BaseSchema {
  protected tableName = 'pedido_itens'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().notNullable()
      table.integer('menu_item_id').unsigned().notNullable()
      table.string('item_name', 100).notNullable() // Snapshot do nome
      table.decimal('unit_price', 10, 2).notNullable() // Snapshot do preço
      table.integer('quantity').unsigned().notNullable().defaultTo(1)
      table.decimal('total_price', 10, 2).notNullable()
      table.string('status').notNullable().defaultTo('pending') // pending, preparing, ready, served, cancelled
      table.text('special_instructions').nullable()
      table.json('customizations').nullable() // Personalizações/observações estruturadas
      table.timestamp('prepared_at').nullable()
      table.timestamp('served_at').nullable()
      table.timestamp('cancelled_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('order_id').references('pedidos.id').onDelete('CASCADE')
      table.foreign('menu_item_id').references('cardapio_produtos.id').onDelete('RESTRICT')

      // Indexes
      table.index(['order_id', 'status'])
      table.index(['menu_item_id'])
      table.index(['status', 'created_at'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
