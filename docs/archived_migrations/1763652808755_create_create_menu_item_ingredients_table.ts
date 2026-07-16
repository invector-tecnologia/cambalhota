import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: cardapio_product_ingredients
// Model: CardapioProductIngredient (app/models/cardapio_product_ingredient.ts)
export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos_ingredientes'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamentos
      table
        .integer('menu_item_id')
        .unsigned()
        .references('cardapio_produtos.id')
        .onDelete('CASCADE')
      table.integer('product_id').unsigned().references('insumos.id').onDelete('CASCADE')

      // Quantidade do ingrediente
      table.decimal('quantity', 12, 4).notNullable()
      table.string('unit').notNullable() // Unidade de medida

      // Custo calculado (para cache)
      table.decimal('unit_cost', 12, 2).defaultTo(0) // Custo unitário do produto
      table.decimal('total_cost', 12, 2).defaultTo(0) // Custo total (quantity * unit_cost)

      // Configurações
      table.boolean('optional').defaultTo(false) // Ingrediente opcional
      table.text('notes').nullable() // Observações sobre o ingrediente
      table.integer('sort_order').defaultTo(0) // Ordem na receita

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['menu_item_id'])
      table.index(['product_id'])

      // Unique constraint para evitar ingrediente duplicado no mesmo item
      table.unique(['menu_item_id', 'product_id'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
