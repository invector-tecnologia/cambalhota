import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasFornecedores = await this.schema.withSchema('tavolo').hasTable('fornecedores')
    if (!hasFornecedores) {
      this.schema.withSchema('tavolo').createTable('fornecedores', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('name').notNullable()
        table.string('trade_name').nullable()
        table.string('document').notNullable()
        table.enum('document_type', ['cpf', 'cnpj']).notNullable()
        table.string('ie').nullable()
        table.string('address').nullable()
        table.string('address_number').nullable()
        table.string('address_complement').nullable()
        table.string('neighborhood').nullable()
        table.string('city').nullable()
        table.string('state', 2).nullable()
        table.string('zip_code', 9).nullable()
        table.string('phone').nullable()
        table.string('email').nullable()
        table.string('contact_person').nullable()
        table.text('notes').nullable()
        table
          .enum('payment_terms', ['vista', '7d', '15d', '30d', '45d', '60d'])
          .defaultTo('vista')
        table.boolean('active').defaultTo(true)
        table
          .integer('created_by')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table
          .integer('updated_by')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['empresa_id', 'document'])
      })
    }

    const hasInsumos = await this.schema.withSchema('tavolo').hasTable('insumos')
    if (!hasInsumos) {
      this.schema.withSchema('tavolo').createTable('insumos', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('code').nullable()
        table.string('barcode').nullable()
        table.string('name').notNullable()
        table.text('description').nullable()
        table
          .enum('type', ['ingredient', 'finished_product', 'beverage', 'supply'])
          .notNullable()
        table.string('category').nullable()
        table.string('subcategory').nullable()
        table.string('unit').notNullable()
        table.string('purchase_unit').nullable()
        table.decimal('conversion_factor', 10, 2).defaultTo(1)
        table.decimal('purchase_price', 12, 2).defaultTo(0)
        table.decimal('sale_price', 12, 2).nullable()
        table.decimal('cost_price', 12, 2).nullable()
        table.decimal('current_stock', 12, 2).defaultTo(0)
        table.decimal('minimum_stock', 12, 2).defaultTo(0)
        table.decimal('maximum_stock', 12, 2).nullable()
        table.boolean('stock_control').defaultTo(true)
        table.string('ncm', 8).nullable()
        table.string('cest', 7).nullable()
        table.decimal('tax_rate', 5, 2).defaultTo(0)
        table
          .integer('fornecedor_padrao_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('fornecedores')
          .onDelete('SET NULL')
        table.boolean('perishable').defaultTo(false)
        table.integer('shelf_life_days').nullable()
        table.boolean('active').defaultTo(true)
        table
          .integer('created_by')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table
          .integer('updated_by')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL')
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['empresa_id', 'code'])
        table.index(['empresa_id', 'barcode'])
        table.index(['empresa_id', 'type'])
      })
    }
  }

  async down() {
    this.schema.withSchema('tavolo').dropTable('insumos')
    this.schema.withSchema('tavolo').dropTable('fornecedores')
  }
}
