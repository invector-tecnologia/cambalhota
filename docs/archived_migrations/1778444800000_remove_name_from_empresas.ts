import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'empresas'

  async up() {
    // PASSO 1: Migrar dados de 'name' para 'razao_social' onde necessário
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'name'
        ) THEN
          UPDATE ${this.tableName} 
          SET razao_social = COALESCE(name, razao_social)
          WHERE name IS NOT NULL AND (razao_social IS NULL OR razao_social = '');
        END IF;
      END $$;
    `)

    // PASSO 2: Tornar razao_social NOT NULL e remover coluna 'name'
    await this.schema.alterTable(this.tableName, (table) => {
      table.string('razao_social', 255).notNullable().alter()
    })

    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'name'
        ) THEN
          ALTER TABLE ${this.tableName} DROP COLUMN name;
        END IF;
      END $$;
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'name'
        ) THEN
          ALTER TABLE ${this.tableName} ADD COLUMN name VARCHAR(100) NULL;
        END IF;
      END $$;
    `)

    await this.schema.alterTable(this.tableName, (table) => {
      // Tornar razao_social nullable novamente
      table.string('razao_social', 255).nullable().alter()
    })

    // Copiar dados de volta de razao_social para name
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'name'
        ) THEN
          UPDATE ${this.tableName} 
          SET name = razao_social
          WHERE razao_social IS NOT NULL;
        END IF;
      END $$;
    `)
  }
}
