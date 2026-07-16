import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * NO-OP: This migration tries to add columns to the 'mesas' table,
 * but the 'mesas' table is only created in 1773691100000_create_mesas_table.ts.
 * We will add these columns in a new migration that runs after 1773.
 */
export default class extends BaseSchema {
  async up() {}
  async down() {}
}
