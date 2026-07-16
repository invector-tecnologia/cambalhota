import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddLogoUrlToEmpresasTable extends BaseSchema {
  protected tableName = 'empresas'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('logo_url', 2048).nullable()
    })
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo_url')
    })
  }
}
