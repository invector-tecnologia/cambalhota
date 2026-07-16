import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'funcionario_funcoes'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('funcionario_id').unsigned().notNullable()
      table.integer('funcao_id').unsigned().notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('funcionario_id').references('funcionarios.id').onDelete('CASCADE')
      table.foreign('funcao_id').references('funcoes.id').onDelete('CASCADE')

      // Unique constraint
      table.unique(['funcionario_id', 'funcao_id'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
