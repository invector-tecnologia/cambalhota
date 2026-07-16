import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: cardapio_categories
// Model: CardapioCategory (app/models/cardapio_category.ts)
export default class extends BaseSchema {
  protected tableName = 'cardapio_categorias'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamento
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')

      // Dados da categoria
      table.string('name').notNullable()
      table.string('description').nullable()
      table.string('color', 7).defaultTo('#6B7280') // Cor hexadecimal
      table.integer('sort_order').defaultTo(0) // Ordem de exibição
      table.boolean('active').defaultTo(true)

      // Configurações
      table.boolean('show_in_menu').defaultTo(true) // Exibir no cardápio
      table.time('available_from').nullable() // Disponível a partir de
      table.time('available_until').nullable() // Disponível até

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['company_id', 'active'])
      table.index(['company_id', 'sort_order'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
