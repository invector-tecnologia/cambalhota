import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.binary('image_data').nullable() // Armazena a imagem em formato binário (BYTEA no PostgreSQL)
      table.string('image_mime_type', 50).nullable() // Tipo MIME da imagem (image/jpeg, image/png, etc)
      table.string('image_filename', 255).nullable() // Nome original do arquivo
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image_data')
      table.dropColumn('image_mime_type')
      table.dropColumn('image_filename')
    })
  }
}
