import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed nfe_items → nota_fiscal_itens.
 * Table is now created directly as nota_fiscal_itens (inside the nfes migration).
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
