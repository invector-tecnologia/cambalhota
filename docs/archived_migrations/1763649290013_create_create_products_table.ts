import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: insumos
// Model: Insumo (app/models/insumo.ts)
export default class extends BaseSchema {
  protected tableName = 'insumos'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamento
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')

      // Identificação
      table.string('code').nullable() // Código interno
      table.string('barcode').nullable() // Código de barras
      table.string('name').notNullable()
      table.text('description').nullable()

      // Classificação
      table.enum('type', ['ingredient', 'finished_product', 'beverage', 'supply']).notNullable()
      table.string('category').nullable() // Ex: Carnes, Verduras, Bebidas
      table.string('subcategory').nullable()

      // Unidades de medida
      table.string('unit').notNullable() // kg, un, l, etc
      table.string('purchase_unit').nullable() // Unidade de compra (pode ser diferente)
      table.decimal('conversion_factor', 10, 4).defaultTo(1) // Fator conversão compra/uso

      // Preços e custos
      table.decimal('purchase_price', 12, 2).defaultTo(0)
      table.decimal('sale_price', 12, 2).nullable()
      table.decimal('cost_price', 12, 2).nullable() // Preço de custo calculado

      // Controle de estoque
      table.decimal('current_stock', 12, 4).defaultTo(0)
      table.decimal('minimum_stock', 12, 4).defaultTo(0)
      table.decimal('maximum_stock', 12, 4).nullable()
      table.boolean('stock_control').defaultTo(true)

      // Informações fiscais
      table.string('ncm', 8).nullable() // Código NCM
      table.string('cest', 7).nullable() // Código CEST
      table.decimal('tax_rate', 5, 2).defaultTo(0) // Alíquota de imposto

      // Fornecedor padrão
      table.integer('default_supplier_id').unsigned().nullable().references('fornecedores.id')

      // Validade e perecibilidade
      table.boolean('perishable').defaultTo(false)
      table.integer('shelf_life_days').nullable() // Prazo de validade em dias

      // Status
      table.boolean('active').defaultTo(true)

      // Auditoria
      table.integer('created_by').unsigned().nullable().references('users.id')
      table.integer('updated_by').unsigned().nullable().references('users.id')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['company_id', 'code'])
      table.index(['company_id', 'barcode'])
      table.index(['company_id', 'type'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
