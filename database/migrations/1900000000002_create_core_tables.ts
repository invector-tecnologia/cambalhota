import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasRoles = await this.schema.withSchema('tavolo').hasTable('roles')
    if (!hasRoles) {
      this.schema.withSchema('tavolo').createTable('roles', (table) => {
        table.increments('id').primary()
        table.string('name').unique().notNullable()
        table.string('description').nullable()
        table.json('permissions').defaultTo('{}')
        table.boolean('active').defaultTo(true)
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasEmpresas = await this.schema.withSchema('tavolo').hasTable('empresas')
    if (!hasEmpresas) {
      this.schema.withSchema('tavolo').createTable('empresas', (table) => {
        table.increments('id').primary()
        table.string('razao_social', 255).notNullable()
        table.string('trade_name', 255).nullable()
        table.string('cnpj', 18).nullable().unique()
        table.string('cpf', 14).nullable()
        table.enum('document_type', ['cpf', 'cnpj']).defaultTo('cnpj')
        table.string('ie').nullable()
        table.string('im').nullable()
        table.integer('regime_tributario').defaultTo(1)
        table.string('cod_municipio', 7).nullable()
        table.string('address').notNullable()
        table.string('address_number').nullable()
        table.string('address_complement').nullable()
        table.string('neighborhood').notNullable()
        table.string('city').notNullable()
        table.string('state', 2).notNullable().defaultTo('SP')
        table.string('zip_code', 9).notNullable()
        table.string('phone').nullable()
        table.string('email').nullable()
        table.string('website').nullable()
        table.boolean('active').defaultTo(true)
        table.string('logo_url', 2048).nullable()
        table.text('nota_fiscal_footer_message').nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      })
    }

    const hasMunicipiosIbge = await this.schema.withSchema('tavolo').hasTable('municipios_ibge')
    if (!hasMunicipiosIbge) {
      this.schema.withSchema('tavolo').createTable('municipios_ibge', (table) => {
        table.string('codigo', 7).primary()
        table.string('nome', 100).notNullable()
        table.string('uf', 2).notNullable()
        table.integer('codigo_uf').notNullable()
        table.index(['nome', 'uf'])
        table.index(['uf'])
      })
    }
  }

  async down() {
    this.schema.withSchema('tavolo').dropTableIfExists('municipios_ibge')
    this.schema.withSchema('tavolo').dropTableIfExists('empresas')
    this.schema.withSchema('tavolo').dropTableIfExists('roles')
  }
}
