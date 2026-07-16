import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'funcionarios'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('empresa_id').unsigned().notNullable()
      table.string('name', 100).notNullable()
      table.string('cpf', 14).nullable()
      table.string('email', 100).nullable()
      table.string('phone', 20).nullable()
      table.date('hire_date').nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.text('notes').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Foreign keys
      table.foreign('empresa_id').references('empresas.id').onDelete('CASCADE')

      // Indexes
      table.index(['empresa_id', 'active'])
      table.index(['empresa_id', 'name'])
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
