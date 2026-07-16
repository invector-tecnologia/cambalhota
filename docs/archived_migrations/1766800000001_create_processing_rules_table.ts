import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'processing_rules'

  async up() {
    if (!(await this.schema.hasTable(this.tableName))) {
      await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.string('name').notNullable()
      table
        .enum('type', [
          'stock_reservation',
          'stock_deduction',
          'discount_apply',
          'nfe_emit',
          'comanda_closing',
          'pedido_status_sync',
          'custom',
        ])
        .notNullable()
      table.integer('priority').unsigned().defaultTo(50).notNullable()
      table.boolean('enabled').defaultTo(true).notNullable()
      table.string('handler').notNullable().comment('Service method path: "ServiceName.methodName"')
      table.json('config').nullable()
      table.enum('applied_to', ['pedido', 'venda', 'comanda', 'nfe', 'geral']).notNullable()
      table.text('description').nullable()

      table.timestamps(true, true)

      table.foreign('empresa_id').references('id').inTable('empresas').onDelete('CASCADE')
      table.index(['empresa_id', 'enabled'])
      table.index(['type'])
      table.index(['applied_to'])
    })
    }
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
