import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    // Garante coluna comanda_id (idempotente)
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      ADD COLUMN IF NOT EXISTS comanda_id integer
    `)

    // Garante order_id nullable (compatibilidade)
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'order_id'
        ) THEN
          ALTER TABLE ${this.tableName} ALTER COLUMN order_id DROP NOT NULL;
        END IF;
      END $$;
    `)

    // Backfill comanda_id a partir de pedidos
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'order_id'
        ) THEN
          UPDATE ${this.tableName} fn
          SET comanda_id = (
            SELECT comanda_id
            FROM pedidos
            WHERE pedidos.id = fn.order_id
          )
          WHERE order_id IS NOT NULL
          AND comanda_id IS NULL;
        END IF;
      END $$;
    `)

    // Garante FK (idempotente)
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = '${this.tableName}'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name = '${this.tableName}_comanda_id_foreign'
        ) THEN
          ALTER TABLE ${this.tableName}
          ADD CONSTRAINT ${this.tableName}_comanda_id_foreign
          FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `)
  }

  async down() {
    // Remove FK e coluna se existir (idempotente)
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = '${this.tableName}'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name = '${this.tableName}_comanda_id_foreign'
        ) THEN
          ALTER TABLE ${this.tableName}
          DROP CONSTRAINT ${this.tableName}_comanda_id_foreign;
        END IF;
      END $$;
    `)

    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName}
      DROP COLUMN IF EXISTS comanda_id
    `)
  }
}
