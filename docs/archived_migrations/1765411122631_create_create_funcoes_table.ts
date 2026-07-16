import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'funcoes'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 50).notNullable().unique()
      table.string('description', 200).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Inserir funções padrão
    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        { name: 'Atendente', description: 'Responsável por atender clientes e registrar pedidos' },
        { name: 'Cozinheiro', description: 'Responsável pelo preparo dos alimentos' },
        { name: 'Gerente', description: 'Responsável pela gestão geral do estabelecimento' },
        { name: 'Caixa', description: 'Responsável pelo fechamento de contas' },
        { name: 'Auxiliar de Cozinha', description: 'Auxilia no preparo dos alimentos' },
        { name: 'Barman', description: 'Responsável pelo preparo de bebidas' },
      ])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
