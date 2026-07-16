import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comandas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('mesa_id').unsigned().nullable()
      table.foreign('mesa_id').references('mesas.id').onDelete('SET NULL')
      table.index(['mesa_id'])
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['mesa_id'])
      table.dropColumn('mesa_id')
    })
  }
}
