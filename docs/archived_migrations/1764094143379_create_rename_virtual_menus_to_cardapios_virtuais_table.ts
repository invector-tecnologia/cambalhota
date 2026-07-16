import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: Creation migration already creates table with final Portuguese name.
 * Original: renamed virtual_menus → cardapios_virtuais.
 * Table is now created directly as cardapios_virtuais.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
