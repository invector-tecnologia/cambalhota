import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pedidos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.integer('funcionario_id').unsigned().nullable().after('user_id')
      table.foreign('funcionario_id').references('funcionarios.id').onDelete('SET NULL')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['funcionario_id'])
      table.dropColumn('funcionario_id')
    })
  }
}
