import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    /**
     * fiscal_configs
     */
    await this.schema.withSchema('tavolo').createTable('fiscal_configs', (table) => {
      table.uuid('id').primary()
      table
        .integer('establishment_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.string('certificate_path').nullable()
      table.string('certificate_password').nullable()
      table.string('csc_token').nullable()
      table.string('csc_id').nullable()
      table.boolean('is_homologation').defaultTo(true)
      table.integer('next_nfe_number').defaultTo(1)
      table.string('state_override', 2).nullable()
      table.string('autorizador', 20).nullable()
      table.integer('serie').defaultTo(1)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['establishment_id'])
    })

    /**
     * fiscal_notes
     */
    await this.schema.withSchema('tavolo').createTable('fiscal_notes', (table) => {
      table.uuid('id').primary()
      table
        .integer('venda_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('vendas')
        .onDelete('CASCADE')
      table
        .uuid('fiscal_config_id')
        .nullable()
        .references('id')
        .inTable('fiscal_configs')
        .onDelete('SET NULL')
      table
        .enum('status', ['PENDING', 'AUTHORIZED', 'CANCELLED', 'CONTINGENCY', 'ERROR'])
        .defaultTo('PENDING')
      table.text('xml_content').nullable()
      table.string('access_key', 44).nullable()
      table.string('protocol_number').nullable()
      table.string('danfe_url').nullable()
      table.json('error_log').nullable()
      table.string('uf', 2).nullable()
      table.integer('numero').nullable()
      table.integer('serie').defaultTo(1)
      table.integer('attempt_count').defaultTo(0)
      table.timestamp('last_attempt_at', { useTz: true }).nullable()
      table.text('last_attempt_error').nullable()
      table.boolean('is_retryable').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['venda_id'])
      table.index(['fiscal_config_id'])
      table.index(['status'])
      table.index(['access_key'])
      table.index(['uf', 'numero', 'serie'])
      table.index(['status', 'is_retryable', 'updated_at'])
      table.index(['attempt_count'])
    })

    /**
     * notas_fiscais
     */
    await this.schema.withSchema('tavolo').createTable('notas_fiscais', (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table
        .integer('fornecedor_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('fornecedores')
        .onDelete('RESTRICT')
      table.string('access_key', 44).unique().notNullable()
      table.string('number').notNullable()
      table.string('series').notNullable()
      table.string('model', 2).notNullable()
      table.dateTime('issue_date').notNullable()
      table.dateTime('entry_date').nullable()
      table.decimal('total_value', 12, 2).notNullable()
      table.decimal('products_value', 12, 2).notNullable()
      table.decimal('tax_value', 12, 2).defaultTo(0)
      table.decimal('freight_value', 12, 2).defaultTo(0)
      table.decimal('discount_value', 12, 2).defaultTo(0)
      table
        .enum('status', ['pending', 'processing', 'processed', 'error'])
        .defaultTo('pending')
      table.text('error_message').nullable()
      table.text('xml_content').nullable()
      table
        .integer('processed_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.dateTime('processed_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    /**
     * nota_fiscal_itens
     */
    await this.schema.withSchema('tavolo').createTable('nota_fiscal_itens', (table) => {
      table.increments('id').primary()
      table
        .integer('nota_fiscal_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('notas_fiscais')
        .onDelete('CASCADE')
      table
        .integer('insumo_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('insumos')
        .onDelete('SET NULL')
      table.string('code').nullable()
      table.string('barcode').nullable()
      table.string('description').notNullable()
      table.string('ncm', 8).nullable()
      table.string('unit').notNullable()
      table.decimal('quantity', 12, 4).notNullable()
      table.decimal('unit_value', 12, 2).notNullable()
      table.decimal('total_value', 12, 2).notNullable()
      table.decimal('tax_value', 12, 2).defaultTo(0)
      table.boolean('processed').defaultTo(false)
      table.boolean('stock_updated').defaultTo(false)
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    await this.schema.withSchema('tavolo').dropTable('nota_fiscal_itens')
    await this.schema.withSchema('tavolo').dropTable('notas_fiscais')
    await this.schema.withSchema('tavolo').dropTable('fiscal_notes')
    await this.schema.withSchema('tavolo').dropTable('fiscal_configs')
  }
}
