import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    // Verifica se a coluna comanda_id já existe
    const hasComandaId = await this.db.rawQuery(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = '${this.tableName}' 
       AND column_name = 'comanda_id'`
    )

    if (!hasComandaId.rows || hasComandaId.rows.length === 0) {
      // Coluna não existe, criar
      await this.schema.alterTable(this.tableName, (table) => {
        table.integer('comanda_id').unsigned().nullable()
      })
    }

    // Tornar order_id nullable se ainda não for
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

    // Migrar dados (safe - não faz nada se já migrado)
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

    // Verificar se a FK já existe
    const hasForeignKey = await this.db.rawQuery(
      `SELECT constraint_name 
       FROM information_schema.table_constraints 
       WHERE table_name = '${this.tableName}' 
       AND constraint_type = 'FOREIGN KEY'
       AND constraint_name = '${this.tableName}_comanda_id_foreign'`
    )

    if (!hasForeignKey.rows || hasForeignKey.rows.length === 0) {
      // FK não existe, criar
      await this.schema.alterTable(this.tableName, (table) => {
        table.foreign('comanda_id').references('id').inTable('comandas').onDelete('CASCADE')
      })
    }
  }

  async down() {
    // Remove FK
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['comanda_id'])
    })
  }
}
