import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migrations already create tables with final Portuguese names.
 * Original: renamed orders → pedidos, order_items → pedido_items.
 * Tables are now created directly as pedidos, pedido_itens.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
