import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migrations already create tables with final Portuguese names.
 * Original: renamed suppliers → fornecedores, products → insumos, nfes → notas_fiscais.
 * Tables are now created directly as fornecedores, insumos, notas_fiscais.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
