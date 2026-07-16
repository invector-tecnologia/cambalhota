import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasUsers = await this.schema.withSchema('tavolo').hasTable('users')
    if (!hasUsers) {
      this.schema.withSchema('tavolo').createTable('users', (table) => {
        table.increments('id').primary()
        table.string('full_name').nullable()
        table.string('email', 254).unique().notNullable()
        table.string('password').notNullable()
        table.string('cpf', 14).nullable()
        table.string('phone').nullable()
        table.date('birth_date').nullable()
        table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active')
        table.string('theme', 50).notNullable().defaultTo('Light')
        table.boolean('email_verified').defaultTo(false)
        table.string('verification_token').nullable()
        table.timestamp('verification_token_expires_at', { useTz: true }).nullable()
        table.timestamp('email_verified_at', { useTz: true }).nullable()
        table.integer('empresa_id').unsigned().notNullable().references('id').inTable('empresas').onDelete('CASCADE')
        table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('RESTRICT')
        table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
        table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }
  }

  async down() {
    this.schema.withSchema('tavolo').dropTableIfExists('users')
  }
}
