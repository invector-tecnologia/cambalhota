import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table
        .boolean('requires_preparation')
        .defaultTo(true)
        .comment('Indica se o produto requer preparo na cozinha')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('requires_preparation')
    })
  }
}
