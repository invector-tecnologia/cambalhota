import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = ''

  async up() {
    /**
     * Remove all binary image storage columns from empresas and cardapio_produtos tables.
     * System now uses Cloudflare Images exclusively - only storing imageUrl and logoUrl.
     */

    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'logo_data') THEN
          ALTER TABLE empresas DROP COLUMN logo_data;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'logo_mime_type') THEN
          ALTER TABLE empresas DROP COLUMN logo_mime_type;
        END IF;
      END $$;
    `)

    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cardapio_produtos' AND column_name = 'image_data') THEN
          ALTER TABLE cardapio_produtos DROP COLUMN image_data;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cardapio_produtos' AND column_name = 'image_mime_type') THEN
          ALTER TABLE cardapio_produtos DROP COLUMN image_mime_type;
        END IF;
      END $$;
    `)
  }

  async down() {
    /**
     * Restore binary image columns (rollback only - data is lost)
     */

    // Restore binary columns to empresas table
    await this.schema.table('empresas', (table) => {
      table.binary('logo_data').nullable()
      table.string('logo_mime_type').nullable()
    })

    // Restore binary columns to cardapio_produtos table
    await this.schema.table('cardapio_produtos', (table) => {
      table.binary('image_data').nullable()
      table.string('image_mime_type').nullable()
    })
  }
}
