import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed cardapio_products → cardapio_produtos.
 * Table is now created directly as cardapio_produtos.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
