import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: cardapio_products
// Model: CardapioProduct (app/models/cardapio_product.ts)
export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamentos
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')
      table
        .integer('menu_category_id')
        .unsigned()
        .references('cardapio_categorias.id')
        .onDelete('CASCADE')

      // Dados do item
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('image_url').nullable()

      // Precificação
      table.decimal('cost_price', 12, 2).defaultTo(0) // Custo dos ingredientes (calculado)
      table.decimal('sale_price', 12, 2).notNullable() // Preço de venda
      table.decimal('markup_percentage', 5, 2).defaultTo(0) // % de markup sobre o custo

      // Informações nutricionais (opcionais)
      table.decimal('calories', 8, 2).nullable()
      table.decimal('protein', 8, 2).nullable()
      table.decimal('carbs', 8, 2).nullable()
      table.decimal('fat', 8, 2).nullable()

      // Configurações
      table.boolean('active').defaultTo(true)
      table.boolean('available').defaultTo(true) // Disponível para pedidos
      table.integer('sort_order').defaultTo(0) // Ordem na categoria
      table.integer('preparation_time').defaultTo(0) // Tempo de preparo em minutos

      // Controle de estoque
      table.boolean('track_stock').defaultTo(true) // Se deve verificar estoque dos ingredientes
      table.integer('daily_limit').nullable() // Limite diário de vendas
      table.integer('daily_sold').defaultTo(0) // Quantidade vendida hoje

      // Disponibilidade por período
      table.time('available_from').nullable()
      table.time('available_until').nullable()
      table.json('available_days').nullable() // Array com dias da semana [0-6]

      // Alergênios e restrições
      table.json('allergens').nullable() // Array com alérgenos
      table.boolean('vegetarian').defaultTo(false)
      table.boolean('vegan').defaultTo(false)
      table.boolean('gluten_free').defaultTo(false)
      table.boolean('lactose_free').defaultTo(false)

      // Tags e classificações
      table.json('tags').nullable() // Array com tags livres
      table.enum('spice_level', ['none', 'mild', 'medium', 'hot', 'very_hot']).defaultTo('none')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['company_id', 'active'])
      table.index(['menu_category_id', 'sort_order'])
      table.index(['company_id', 'available'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
