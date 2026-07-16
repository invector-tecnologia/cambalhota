import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed tables → mesas.
 * Table is now created directly as comandas (the original 'tables' concept became 'comandas').
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
