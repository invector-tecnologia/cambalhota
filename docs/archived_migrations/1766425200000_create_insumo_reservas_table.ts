import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'insumo_reservas'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('empresa_id')
        .unsigned()
        .references('id')
        .inTable('empresas')
        .onDelete('CASCADE')
      table.integer('insumo_id').unsigned().references('id').inTable('insumos').onDelete('CASCADE')
      table.integer('pedido_id').unsigned().references('id').inTable('pedidos').onDelete('CASCADE')
      table
        .integer('pedido_item_id')
        .unsigned()
        .references('id')
        .inTable('pedido_itens')
        .onDelete('CASCADE')
      table.decimal('quantidade', 12, 3).notNullable()
      table.string('unidade').notNullable()
      table.enum('status', ['reserved', 'deducted', 'released']).defaultTo('reserved')
      table.timestamp('reserved_at').notNullable()
      table.timestamp('deducted_at').nullable()
      table.timestamp('released_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Índices para melhorar performance
      table.index(['empresa_id'])
      table.index(['insumo_id'])
      table.index(['pedido_id'])
      table.index(['status'])
      table.index(['pedido_item_id'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
