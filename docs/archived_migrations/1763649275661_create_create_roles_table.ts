import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.string('name').unique().notNullable()
      table.string('description').nullable()

      // Permissões por módulo
      table.json('permissions').defaultTo('{}') // JSON com permissões específicas

      table.boolean('active').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Inserir roles básicos
    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        {
          name: 'admin',
          description: 'Administrador do sistema',
          permissions: JSON.stringify({
            almoxarifado: ['create', 'read', 'update', 'delete'],
            cardapio: ['create', 'read', 'update', 'delete'],
            pedidos: ['create', 'read', 'update', 'delete'],
            comandas: ['create', 'read', 'update', 'delete'],
            financeiro: ['create', 'read', 'update', 'delete'],
            usuarios: ['create', 'read', 'update', 'delete'],
          }),
          created_at: new Date(),
        },
        {
          name: 'gerente',
          description: 'Gerente do restaurante',
          permissions: JSON.stringify({
            almoxarifado: ['create', 'read', 'update'],
            cardapio: ['create', 'read', 'update'],
            pedidos: ['read', 'update'],
            comandas: ['read', 'update'],
            financeiro: ['read'],
            usuarios: ['read'],
          }),
          created_at: new Date(),
        },
        {
          name: 'funcionario',
          description: 'Funcionário do restaurante',
          permissions: JSON.stringify({
            almoxarifado: ['read'],
            cardapio: ['read'],
            pedidos: ['create', 'read'],
            comandas: ['create', 'read', 'update'],
            financeiro: [],
            usuarios: [],
          }),
          created_at: new Date(),
        },
      ])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
