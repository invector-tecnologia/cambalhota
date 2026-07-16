import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Logo da empresa para impressão (armazenada como BYTEA)
      table.binary('logo_data')
      table.string('logo_mime_type', 100)
      table.string('logo_filename', 255)

      // Mensagem de rodapé da nota fiscal
      table.text('nota_fiscal_footer_message')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo_data')
      table.dropColumn('logo_mime_type')
      table.dropColumn('logo_filename')
      table.dropColumn('nota_fiscal_footer_message')
    })
  }
}
