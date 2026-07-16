import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('company_id', 'empresa_id')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
  }
}
