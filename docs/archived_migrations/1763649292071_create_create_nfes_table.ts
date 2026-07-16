import { BaseSchema } from '@adonisjs/lucid/schema'

// Tabela: notas_fiscais
// Model: Nfe (app/models/nfe.ts)
export default class extends BaseSchema {
  protected tableName = 'notas_fiscais'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relacionamentos
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')
      table.integer('supplier_id').unsigned().references('fornecedores.id').onDelete('CASCADE')

      // Identificação da NFe
      table.string('access_key', 44).unique().notNullable() // Chave de acesso
      table.string('number').notNullable() // Número da nota
      table.string('series').notNullable() // Série
      table.string('model', 2).notNullable() // Modelo (55, 65, etc)

      // Datas
      table.datetime('issue_date').notNullable() // Data de emissão
      table.datetime('entry_date').nullable() // Data de entrada no estoque

      // Valores
      table.decimal('total_value', 12, 2).notNullable()
      table.decimal('products_value', 12, 2).notNullable()
      table.decimal('tax_value', 12, 2).defaultTo(0)
      table.decimal('freight_value', 12, 2).defaultTo(0)
      table.decimal('discount_value', 12, 2).defaultTo(0)

      // Status
      table.enum('status', ['pending', 'processing', 'processed', 'error']).defaultTo('pending')
      table.text('error_message').nullable() // Mensagem de erro se houver

      // XML da NFe
      table.text('xml_content').nullable() // Conteúdo completo do XML

      // Auditoria
      table.integer('processed_by').unsigned().nullable().references('users.id')
      table.datetime('processed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['company_id', 'issue_date'])
      table.index(['supplier_id', 'issue_date'])
    })

    // Tabela de itens da NFe
    await this.schema.createTable('nota_fiscal_itens', (table) => {
      table.increments('id').notNullable()

      // Relacionamentos
      table.integer('nfe_id').unsigned().references('notas_fiscais.id').onDelete('CASCADE')
      table.integer('product_id').unsigned().nullable().references('insumos.id') // Pode ser null se produto não encontrado

      // Dados do item na NFe
      table.string('code').nullable() // Código do produto na NFe
      table.string('barcode').nullable() // EAN do produto
      table.string('description').notNullable()
      table.string('ncm', 8).nullable()
      table.string('unit').notNullable()

      // Quantidades e valores
      table.decimal('quantity', 12, 4).notNullable()
      table.decimal('unit_value', 12, 2).notNullable()
      table.decimal('total_value', 12, 2).notNullable()
      table.decimal('tax_value', 12, 2).defaultTo(0)

      // Status do processamento
      table.boolean('processed').defaultTo(false)
      table.boolean('stock_updated').defaultTo(false) // Se já foi dado entrada no estoque
      table.text('notes').nullable() // Observações sobre o item

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Índices
      table.index(['nfe_id'])
      table.index(['product_id'])
    })
  }

  async down() {
    await this.schema.dropTable('nota_fiscal_itens')
    await this.schema.dropTable(this.tableName)
  }
}
