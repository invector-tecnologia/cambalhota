import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Habilita a extensão unaccent para remover acentos em buscas
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS unaccent')
  }

  async down() {
    // Remove a extensão unaccent
    await this.db.rawQuery('DROP EXTENSION IF EXISTS unaccent')
  }
}
