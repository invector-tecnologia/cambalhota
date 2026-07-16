import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed cash_registers → caixa_registros.
 * Table is now created directly as caixa_registros.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
