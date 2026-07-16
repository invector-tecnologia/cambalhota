import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasCardapioCategorias = await this.schema.withSchema('tavolo').hasTable('cardapio_categorias')
    if (!hasCardapioCategorias) {
      await this.schema.withSchema('tavolo').createTable('cardapio_categorias', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('name').notNullable()
        table.string('description').nullable()
        table.string('color', 7).defaultTo('#6B7280')
        table.integer('sort_order').defaultTo(0)
        table.boolean('active').defaultTo(true)
        table.boolean('show_in_menu').defaultTo(true)
        table.time('available_from').nullable()
        table.time('available_until').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasCardapioProdutos = await this.schema.withSchema('tavolo').hasTable('cardapio_produtos')
    if (!hasCardapioProdutos) {
      await this.schema.withSchema('tavolo').createTable('cardapio_produtos', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table
          .integer('cardapio_categoria_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('cardapio_categorias')
          .onDelete('CASCADE')
        table.string('name').notNullable()
        table.text('description').nullable()
        table.string('image_url').nullable()
        table.decimal('cost_price', 12, 2).defaultTo(0)
        table.decimal('sale_price', 12, 2).notNullable()
        table.decimal('markup_percentage', 5, 2).defaultTo(0)
        table.decimal('calories', 8, 2).nullable()
        table.decimal('protein', 8, 2).nullable()
        table.decimal('carbs', 8, 2).nullable()
        table.decimal('fat', 8, 2).nullable()
        table.boolean('active').defaultTo(true)
        table.boolean('available').defaultTo(true)
        table.integer('sort_order').defaultTo(0)
        table.integer('preparation_time').defaultTo(0)
        table.boolean('requires_preparation').defaultTo(true)
        table.boolean('track_stock').defaultTo(true)
        table.integer('daily_limit').nullable()
        table.integer('daily_sold').defaultTo(0)
        table.time('available_from').nullable()
        table.time('available_until').nullable()
        table.json('available_days').nullable()
        table.json('allergens').nullable()
        table.boolean('vegetarian').defaultTo(false)
        table.boolean('vegan').defaultTo(false)
        table.boolean('gluten_free').defaultTo(false)
        table.boolean('lactose_free').defaultTo(false)
        table.json('tags').nullable()
        table
          .enum('spice_level', ['none', 'mild', 'medium', 'hot', 'very_hot'])
          .defaultTo('none')
        table.string('ncm', 8).nullable()
        table.string('cfop', 4).defaultTo('5102')
        table.string('cst_icms', 3).nullable()
        table.string('csosn', 3).nullable()
        table.decimal('icms_rate', 5, 2).defaultTo(0)
        table.decimal('pis_rate', 5, 2).defaultTo(0)
        table.decimal('cofins_rate', 5, 2).defaultTo(0)
        table.string('cest', 7).nullable()
        table.string('unit', 6).defaultTo('UN')
        table.string('barcode', 13).nullable()
        table.integer('origem').defaultTo(0)
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasCardapioProdutosIngredientes = await this.schema.withSchema('tavolo').hasTable('cardapio_produtos_ingredientes')
    if (!hasCardapioProdutosIngredientes) {
      await this.schema.withSchema('tavolo').createTable('cardapio_produtos_ingredientes', (table) => {
        table.increments('id').primary()
        table
          .integer('cardapio_produto_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('cardapio_produtos')
          .onDelete('CASCADE')
        table
          .integer('insumo_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('insumos')
          .onDelete('CASCADE')
        table.decimal('quantity', 12, 4).notNullable()
        table.string('unit').notNullable()
        table.decimal('unit_cost', 12, 2).defaultTo(0)
        table.decimal('total_cost', 12, 2).defaultTo(0)
        table.boolean('optional').defaultTo(false)
        table.text('notes').nullable()
        table.integer('sort_order').defaultTo(0)
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.unique(['cardapio_produto_id', 'insumo_id'])
      })
    }

    const hasCardapiosVirtuais = await this.schema.withSchema('tavolo').hasTable('cardapios_virtuais')
    if (!hasCardapiosVirtuais) {
      await this.schema.withSchema('tavolo').createTable('cardapios_virtuais', (table) => {
        table.increments('id').primary()
        table
          .integer('empresa_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('empresas')
          .onDelete('CASCADE')
        table.string('title', 200).notNullable()
        table.text('description').nullable()
        table.string('slug', 255).unique().notNullable()
        table.enum('status', ['draft', 'published']).defaultTo('draft')
        table.string('theme', 50).defaultTo('default')
        table.json('settings').nullable()
        table.timestamp('published_at', { useTz: true }).nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }
  }

  async down() {
    await this.schema.withSchema('tavolo').dropTable('cardapios_virtuais')
    await this.schema.withSchema('tavolo').dropTable('cardapio_produtos_ingredientes')
    await this.schema.withSchema('tavolo').dropTable('cardapio_produtos')
    await this.schema.withSchema('tavolo').dropTable('cardapio_categorias')
  }
}
