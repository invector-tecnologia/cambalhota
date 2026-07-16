import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_configs'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Remove índices e constraint unique antes de alterar o tipo
      table.dropUnique(['establishment_id'])
      table.dropIndex(['establishment_id'])
    })

    // Altera o tipo da coluna de UUID para INTEGER
    await this.schema.raw(`
      ALTER TABLE fiscal_configs 
      ALTER COLUMN establishment_id TYPE INTEGER USING establishment_id::text::integer
    `)

    await this.schema.alterTable(this.tableName, (table) => {
      // Recria os índices e constraints
      table.unique(['establishment_id'])
      table.index(['establishment_id'])

      // Adiciona foreign key para empresas
      table.foreign('establishment_id').references('id').inTable('empresas').onDelete('CASCADE')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Remove foreign key, índices e constraints
      table.dropForeign(['establishment_id'])
      table.dropUnique(['establishment_id'])
      table.dropIndex(['establishment_id'])
    })

    // Volta para UUID
    await this.schema.raw(`
      ALTER TABLE fiscal_configs 
      ALTER COLUMN establishment_id TYPE UUID USING uuid_generate_v4()
    `)

    await this.schema.alterTable(this.tableName, (table) => {
      // Recria índices
      table.unique(['establishment_id'])
      table.index(['establishment_id'])
    })
  }
}
