import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Remove a coluna antiga com UUID
      table.dropColumn('order_id')
    })

    await this.schema.alterTable(this.tableName, (table) => {
      // Adiciona a nova coluna como integer
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .comment('Relacionamento com a venda (pedido)')
      table.index('order_id')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('order_id')
    })

    await this.schema.alterTable(this.tableName, (table) => {
      // Reverte para uuid
      table.uuid('order_id').notNullable().comment('Relacionamento com a venda (pedido)')
      table.index('order_id')
    })
  }
}
