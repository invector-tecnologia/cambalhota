import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos'

  async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      // NCM - Nomenclatura Comum do Mercosul (OBRIGATÓRIO)
      // 8 dígitos - Ex: 19059090 (massas alimentícias, pizza)
      table.string('ncm', 8).nullable().comment('Código NCM do produto')

      // CFOP - Código Fiscal de Operações e Prestações (OBRIGATÓRIO)
      // 4 dígitos - Ex: 5102 (venda dentro do estado)
      table.string('cfop', 4).defaultTo('5102').comment('CFOP padrão para o produto')

      // CST/CSOSN - Código de Situação Tributária (OBRIGATÓRIO)
      // Para Simples Nacional usa CSOSN (3 dígitos)
      // Ex: 102 (tributada sem permissão de crédito)
      table.string('cst_icms', 3).nullable().comment('Código de Situação Tributária ICMS')

      // Alíquotas de impostos (percentuais)
      table.decimal('icms_rate', 5, 2).defaultTo(0.0).comment('Alíquota de ICMS (%)')
      table.decimal('pis_rate', 5, 2).defaultTo(0.0).comment('Alíquota de PIS (%)')
      table.decimal('cofins_rate', 5, 2).defaultTo(0.0).comment('Alíquota de COFINS (%)')

      // CEST - Código Especificador da Substituição Tributária (OPCIONAL)
      // 7 dígitos - obrigatório apenas para produtos com ST
      table.string('cest', 7).nullable().comment('Código CEST para Substituição Tributária')

      // Unidade comercial (OBRIGATÓRIO)
      // Ex: UN, KG, LT, PC, CX
      table.string('unit', 6).defaultTo('UN').comment('Unidade comercial do produto')

      // Código de barras EAN (OPCIONAL mas recomendado)
      table.string('barcode', 13).nullable().comment('Código de barras EAN/GTIN')

      // Origem da mercadoria (OBRIGATÓRIO)
      // 0=Nacional, 1=Estrangeira importação direta, 2=Estrangeira mercado interno
      table.integer('origem').defaultTo(0).comment('Origem da mercadoria (0-8)')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ncm')
      table.dropColumn('cfop')
      table.dropColumn('cst_icms')
      table.dropColumn('icms_rate')
      table.dropColumn('pis_rate')
      table.dropColumn('cofins_rate')
      table.dropColumn('cest')
      table.dropColumn('unit')
      table.dropColumn('barcode')
      table.dropColumn('origem')
    })
  }
}
