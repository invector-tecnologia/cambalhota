import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'assinaturas_empresas'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.string('plano', 50).notNullable().defaultTo('basico')
      table.string('status', 30).notNullable().defaultTo('trial')
      table.decimal('valor_mensal', 10, 2).notNullable().defaultTo(0)
      table.string('moeda', 3).notNullable().defaultTo('BRL')
      table.date('proximo_vencimento').nullable()
      table.date('ultimo_pagamento_em').nullable()
      table.integer('dias_tolerancia').notNullable().defaultTo(5)
      table.string('gateway_ref', 120).nullable()
      table.text('observacoes').nullable()
      table.timestamps(true, true)

      table.foreign('empresa_id').references('id').inTable('empresas').onDelete('CASCADE')
      table.unique(['empresa_id'])
      table.index(['status'])
      table.index(['proximo_vencimento'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
