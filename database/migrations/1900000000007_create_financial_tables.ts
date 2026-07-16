import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasVendas = await this.schema.withSchema('tavolo').hasTable('vendas')
    if (!hasVendas) {
      this.schema.withSchema('tavolo').createTable('vendas', (table) => {
        table.increments('id').primary()
        table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
        table.integer('pedido_id').unsigned().nullable().references('id').inTable('pedidos').onDelete('SET NULL')
        table.integer('comanda_id').unsigned().nullable().references('id').inTable('comandas').onDelete('SET NULL')
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')
        table.string('sale_number', 20).notNullable()
        table.enum('payment_method', ['cash', 'card', 'pix', 'split']).notNullable()
        table.decimal('subtotal', 10, 2).defaultTo(0)
        table.decimal('discount', 10, 2).defaultTo(0)
        table.decimal('tax', 10, 2).defaultTo(0)
        table.decimal('total', 10, 2).defaultTo(0)
        table.decimal('cost_total', 10, 2).defaultTo(0)
        table.decimal('profit', 10, 2).defaultTo(0)
        table.decimal('profit_margin', 5, 2).defaultTo(0)
        table.text('notes').nullable()
        table.timestamp('sale_date').notNullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasVendaItens = await this.schema.withSchema('tavolo').hasTable('venda_itens')
    if (!hasVendaItens) {
      this.schema.withSchema('tavolo').createTable('venda_itens', (table) => {
        table.increments('id').primary()
        table.integer('venda_id').unsigned().notNullable().references('id').inTable('vendas').onDelete('CASCADE')
        table.integer('cardapio_produto_id').unsigned().notNullable().references('id').inTable('cardapio_produtos').onDelete('RESTRICT')
        table.integer('pedido_item_id').unsigned().nullable().references('id').inTable('pedido_itens').onDelete('SET NULL')
        table.string('item_name').notNullable()
        table.decimal('unit_price', 10, 2).defaultTo(0)
        table.decimal('unit_cost', 10, 2).defaultTo(0)
        table.integer('quantity').defaultTo(1)
        table.decimal('subtotal', 10, 2).defaultTo(0)
        table.decimal('cost_total', 10, 2).defaultTo(0)
        table.decimal('profit', 10, 2).defaultTo(0)
        table.decimal('profit_margin', 5, 2).defaultTo(0)
        table.text('special_instructions').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasCaixaRegistros = await this.schema.withSchema('tavolo').hasTable('caixa_registros')
    if (!hasCaixaRegistros) {
      this.schema.withSchema('tavolo').createTable('caixa_registros', (table) => {
        table.increments('id').primary()
        table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')
        table.date('register_date').notNullable()
        table.decimal('opening_balance', 10, 2).defaultTo(0)
        table.decimal('closing_balance', 10, 2).nullable()
        table.decimal('cash_sales', 10, 2).defaultTo(0)
        table.decimal('card_sales', 10, 2).defaultTo(0)
        table.decimal('pix_sales', 10, 2).defaultTo(0)
        table.decimal('total_sales', 10, 2).defaultTo(0)
        table.decimal('total_cost', 10, 2).defaultTo(0)
        table.decimal('total_profit', 10, 2).defaultTo(0)
        table.integer('total_transactions').defaultTo(0)
        table.decimal('average_ticket', 10, 2).defaultTo(0)
        table.enum('status', ['open', 'closed']).defaultTo('open')
        table.timestamp('opened_at').notNullable()
        table.timestamp('closed_at').nullable()
        table.text('notes').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.unique(['empresa_id', 'register_date'])
      })
    }
  }

  async down() {
    this.schema.withSchema('tavolo').dropTable('caixa_registros')
    this.schema.withSchema('tavolo').dropTable('venda_itens')
    this.schema.withSchema('tavolo').dropTable('vendas')
  }
}
