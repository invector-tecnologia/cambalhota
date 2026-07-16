import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_configs'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('establishment_id').notNullable()
      table
        .string('certificate_path')
        .notNullable()
        .comment('Caminho seguro/S3 para o arquivo .pfx')
      table.string('certificate_password').notNullable().comment('Criptografada')
      table.string('csc_token').notNullable().comment('Código de Segurança do Contribuinte')
      table.string('csc_id').notNullable().comment('Identificador do CSC')
      table
        .boolean('is_homologation')
        .defaultTo(true)
        .comment('Define se envia para ambiente de teste ou produção')
      table.integer('next_nfe_number').defaultTo(1).comment('Controle sequencial da numeração')
      table.timestamps(true, true)

      // Índices
      table.unique(['establishment_id'])
      table.index(['establishment_id'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
