import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed cardapio_product_ingredients → cardapio_produtos_ingredientes.
 * Table is now created directly as cardapio_produtos_ingredientes.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
