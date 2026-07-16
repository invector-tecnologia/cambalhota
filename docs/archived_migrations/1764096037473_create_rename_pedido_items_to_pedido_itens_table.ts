import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed pedido_items → pedido_itens.
 * Table is now created directly as pedido_itens.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
