import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Campos para rastreamento de tentativas de emissão
      table.integer('attempt_count').defaultTo(0).comment('Número de tentativas de emissão')
      table.dateTime('last_attempt_at').nullable().comment('Última tentativa de emissão')
      table.text('last_attempt_error').nullable().comment('Erro da última tentativa')
      table.boolean('is_retryable').defaultTo(true).comment('Se pode ser reprocessado')

      // Índices para otimizar query de reprocessamento
      // Nota: colunas uf, numero, serie já existem em produção
      table.index(['status', 'is_retryable', 'updated_at'])
      table.index(['attempt_count'])
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('attempt_count')
      table.dropColumn('last_attempt_at')
      table.dropColumn('last_attempt_error')
      table.dropColumn('is_retryable')
    })
  }
}
