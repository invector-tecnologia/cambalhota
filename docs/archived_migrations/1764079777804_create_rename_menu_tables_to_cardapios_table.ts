import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migrations already create tables with final Portuguese names.
 * Original: renamed menu_categories → cardapio_categories, menu_items → cardapio_products,
 * menu_item_ingredients → cardapio_product_ingredients.
 * Tables are now created directly as cardapio_categorias, cardapio_produtos,
 * cardapio_produtos_ingredientes.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
