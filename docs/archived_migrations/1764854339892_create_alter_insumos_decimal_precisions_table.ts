import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'insumos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Alterar precisão decimal de 4 para 2 casas decimais (padrão brasileiro)
      // Campos de estoque e fator de conversão
      table.decimal('conversion_factor', 10, 2).defaultTo(1).alter()
      table.decimal('current_stock', 12, 2).defaultTo(0).alter()
      table.decimal('minimum_stock', 12, 2).defaultTo(0).alter()
      table.decimal('maximum_stock', 12, 2).nullable().alter()
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Reverter para 4 casas decimais
      table.decimal('conversion_factor', 10, 4).defaultTo(1).alter()
      table.decimal('current_stock', 12, 4).defaultTo(0).alter()
      table.decimal('minimum_stock', 12, 4).defaultTo(0).alter()
      table.decimal('maximum_stock', 12, 4).nullable().alter()
    })
  }
}
