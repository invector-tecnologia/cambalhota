import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasCompanyId = await this.schema.hasColumn(this.tableName, 'company_id')
    if (hasCompanyId) return

    await this.schema.alterTable(this.tableName, (table) => {
      // Relacionamentos
      table.integer('company_id').unsigned().references('empresas.id').onDelete('CASCADE')
      table.integer('role_id').unsigned().references('roles.id').onDelete('RESTRICT')

      // Campos adicionais
      table.string('cpf', 14).unique().nullable()
      table.string('phone').nullable()
      table.date('birth_date').nullable()
      table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active')

      // Auditoria
      table.integer('created_by').unsigned().nullable().references('users.id')
      table.integer('updated_by').unsigned().nullable().references('users.id')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('company_id')
      table.dropColumn('role_id')
      table.dropColumn('cpf')
      table.dropColumn('phone')
      table.dropColumn('birth_date')
      table.dropColumn('status')
      table.dropColumn('created_by')
      table.dropColumn('updated_by')
    })
  }
}
