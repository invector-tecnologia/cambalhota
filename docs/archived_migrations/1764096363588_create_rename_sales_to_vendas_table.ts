import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migrations already create tables with final Portuguese names.
 * Original: renamed sales → vendas, sale_items → venda_itens.
 * Tables are now created directly as vendas, venda_itens.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
