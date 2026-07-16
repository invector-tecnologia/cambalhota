import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.schema.withSchema('tavolo').createTable('mesas', (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
      table.string('number', 20).notNullable()
      table.string('name').nullable()
      table.string('location').nullable()
      table.enum('status', ['available', 'occupied', 'reserved', 'maintenance']).defaultTo('available')
      table.integer('capacity').unsigned().nullable()
      table.boolean('active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['empresa_id', 'number'])
      table.index(['empresa_id'])
    })

    await this.schema.withSchema('tavolo').createTable('comandas', (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
      table.integer('mesa_id').unsigned().nullable().references('id').inTable('mesas').onDelete('SET NULL')
      table.string('number', 10).notNullable()
      table.string('name', 100).nullable()
      table.text('notes').nullable()
      table.boolean('active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['empresa_id', 'number'])
    })

    await this.schema.withSchema('tavolo').createTable('funcionarios', (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.string('cpf', 14).nullable()
      table.string('email', 100).nullable()
      table.string('phone', 20).nullable()
      table.date('hire_date').nullable()
      table.boolean('active').defaultTo(true)
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    await this.schema.withSchema('tavolo').createTable('funcoes', (table) => {
      table.increments('id').primary()
      table.string('name', 50).unique().notNullable()
      table.string('description', 200).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    await this.schema.withSchema('tavolo').createTable('funcionario_funcoes', (table) => {
      table.increments('id').primary()
      table.integer('funcionario_id').unsigned().notNullable().references('id').inTable('funcionarios').onDelete('CASCADE')
      table.integer('funcao_id').unsigned().notNullable().references('id').inTable('funcoes').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['funcionario_id', 'funcao_id'])
    })

    await this.schema.withSchema('tavolo').createTable('pedidos', (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
      table.integer('comanda_id').unsigned().nullable().references('id').inTable('comandas').onDelete('SET NULL')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.integer('funcionario_id').unsigned().nullable().references('id').inTable('funcionarios').onDelete('SET NULL')
      table.string('order_number', 20).notNullable()
      table.string('customer_name', 100).nullable()
      table.string('customer_phone', 20).nullable()
      table.enum('type', ['dine_in', 'takeout', 'delivery']).defaultTo('dine_in')
      table.enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled', 'paid']).defaultTo('pending')
      table.decimal('subtotal', 10, 2).defaultTo(0)
      table.decimal('discount', 10, 2).defaultTo(0)
      table.decimal('service_charge', 10, 2).defaultTo(0)
      table.decimal('total', 10, 2).defaultTo(0)
      table.text('notes').nullable()
      table.text('delivery_address').nullable()
      table.timestamp('confirmed_at').nullable()
      table.timestamp('prepared_at').nullable()
      table.timestamp('served_at').nullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('cancelled_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    await this.schema.withSchema('tavolo').createTable('pedido_itens', (table) => {
      table.increments('id').primary()
      table.integer('pedido_id').unsigned().notNullable().references('id').inTable('pedidos').onDelete('CASCADE')
      table.integer('cardapio_produto_id').unsigned().notNullable().references('id').inTable('cardapio_produtos').onDelete('RESTRICT')
      table.string('item_name', 100).notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.integer('quantity').defaultTo(1)
      table.decimal('total_price', 10, 2).notNullable()
      table.enum('status', ['pending', 'preparing', 'ready', 'served', 'cancelled']).defaultTo('pending')
      table.text('special_instructions').nullable()
      table.json('customizations').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('prepared_at').nullable()
      table.timestamp('served_at').nullable()
      table.timestamp('cancelled_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    await this.schema.withSchema('tavolo').dropTable('pedido_itens')
    await this.schema.withSchema('tavolo').dropTable('pedidos')
    await this.schema.withSchema('tavolo').dropTable('funcionario_funcoes')
    await this.schema.withSchema('tavolo').dropTable('funcoes')
    await this.schema.withSchema('tavolo').dropTable('funcionarios')
    await this.schema.withSchema('tavolo').dropTable('comandas')
    await this.schema.withSchema('tavolo').dropTable('mesas')
  }
}
