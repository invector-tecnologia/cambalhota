import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    // PASSO 1: Adicionar coluna comanda_id se não existir
    await this.db.rawQuery(`
      ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS comanda_id integer;
    `)

    // Tornar order_id nullable se existir
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

    // PASSO 2: Migrar dados (agora a coluna já existe)
    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'order_id'
        ) THEN
          UPDATE fiscal_notes fn
          SET comanda_id = (
            SELECT comanda_id 
            FROM pedidos 
            WHERE pedidos.id = fn.order_id
          )
          WHERE order_id IS NOT NULL;
        END IF;
      END $$;
    `)

    // PASSO 3: Adicionar foreign key
    await this.schema.alterTable(this.tableName, (table) => {
      table.foreign('comanda_id').references('id').inTable('comandas').onDelete('CASCADE')
    })
  }

  async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('comanda_id')
    })

    await this.db.rawQuery(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${this.tableName}' AND column_name = 'order_id'
        ) THEN
          ALTER TABLE ${this.tableName} ALTER COLUMN order_id SET NOT NULL;
        END IF;
      END $$;
    `)
  }
}
