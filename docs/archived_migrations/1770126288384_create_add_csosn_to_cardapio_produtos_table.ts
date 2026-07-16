import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // CSOSN - Código de Situação da Operação do Simples Nacional
      // Para empresas do Simples Nacional (3 dígitos)
      table.string('csosn', 3).nullable().after('cst_icms')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('csosn')
    })
  }
}
