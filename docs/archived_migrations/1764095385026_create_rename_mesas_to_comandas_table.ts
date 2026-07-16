import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed mesas → comandas.
 * Table is now created directly as comandas. Mesas became a separate entity.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
