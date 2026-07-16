import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pedido_itens'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('started_at').nullable()
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('started_at')
    })
  }
}
