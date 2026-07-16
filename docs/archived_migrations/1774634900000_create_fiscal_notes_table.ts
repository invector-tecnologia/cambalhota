import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .comment('Relacionamento com a venda (pedido)')
      table.uuid('fiscal_config_id').notNullable()
      table
        .enum('status', ['PENDING', 'AUTHORIZED', 'CANCELLED', 'CONTINGENCY', 'ERROR'])
        .defaultTo('PENDING')
      table.text('xml_content').nullable().comment('Conteúdo do XML assinado')
      table.string('access_key', 44).nullable().comment('Chave de 44 dígitos')
      table.string('protocol_number').nullable().comment('nProt retornado pela SEFAZ')
      table.string('danfe_url').nullable().comment('Link para o PDF no storage')
      table.json('error_log').nullable().comment('Detalhes técnicos em caso de rejeição')
      table.timestamps(true, true)

      // Índices
      table.index(['order_id'])
      table.index(['fiscal_config_id'])
      table.index(['status'])
      table.index(['access_key'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
