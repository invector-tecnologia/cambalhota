import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery('CREATE SCHEMA IF NOT EXISTS tavolo')
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS unaccent')
  }

  async down() {
    await this.db.rawQuery('DROP SCHEMA IF EXISTS tavolo CASCADE')
  }
}
