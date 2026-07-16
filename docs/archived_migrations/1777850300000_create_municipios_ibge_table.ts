import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'municipios_ibge'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.string('codigo', 7).primary().comment('Código IBGE do município (7 dígitos)')
      table.string('nome', 100).notNullable().comment('Nome do município')
      table.string('uf', 2).notNullable().comment('Sigla da UF')
      table.integer('codigo_uf').notNullable().comment('Código da UF (2 dígitos)')

      // Índices para consultas rápidas
      table.index(['nome', 'uf'], 'idx_municipio_nome_uf')
      table.index('uf', 'idx_municipio_uf')
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
