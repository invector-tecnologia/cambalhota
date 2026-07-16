import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comandas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_active', 'active')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('active', 'is_active')
    })
  }
}
