import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // Razão Social (OBRIGATÓRIO para NFC-e)
      // Vai no XML como <emit><xNome>
      table.string('razao_social', 255).nullable().comment('Razão social da empresa')

      // Regime Tributário (OBRIGATÓRIO)
      // CRT - Código de Regime Tributário
      // 1 = Simples Nacional
      // 2 = Simples Nacional - excesso sublimite de receita bruta
      // 3 = Regime Normal
      table.integer('regime_tributario').defaultTo(1).comment('Código de Regime Tributário (CRT)')

      // Código IBGE do município (OBRIGATÓRIO)
      // 7 dígitos - Ex: 3106200 (Belo Horizonte)
      // Usado em <emit><enderEmit><cMun> e <ide><cMunFG>
      table.string('cod_municipio', 7).nullable().comment('Código IBGE do município')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('razao_social')
      table.dropColumn('regime_tributario')
      table.dropColumn('cod_municipio')
    })
  }
}
