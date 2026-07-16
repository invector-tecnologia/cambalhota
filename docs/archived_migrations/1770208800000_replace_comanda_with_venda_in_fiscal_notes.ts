import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fiscal_notes'

  async up() {
    // Passo 1: Adiciona coluna venda_id usando SQL nativo com verificação
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_notes' AND column_name = 'venda_id'
        ) THEN
          ALTER TABLE fiscal_notes 
          ADD COLUMN venda_id integer NULL 
          REFERENCES vendas(id) ON DELETE CASCADE;
          
          COMMENT ON COLUMN fiscal_notes.venda_id IS 'Relacionamento com a venda (fonte de dados para NF-e)';
        END IF;
      END $$;
    `)

    // Passo 2: Migra dados de comanda_id para venda_id (se comanda_id existir)
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_notes' AND column_name = 'comanda_id'
        ) THEN
          UPDATE fiscal_notes fn
          SET venda_id = (
            SELECT v.id 
            FROM vendas v 
            WHERE v.comanda_id = fn.comanda_id 
            LIMIT 1
          )
          WHERE fn.comanda_id IS NOT NULL AND fn.venda_id IS NULL;
        END IF;
      END $$;
    `)

    // Passo 3: Migra dados de order_id para venda_id (se order_id existir e apontar para vendas)
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_notes' AND column_name = 'order_id'
        ) THEN
          UPDATE fiscal_notes fn
          SET venda_id = fn.order_id
          WHERE fn.order_id IS NOT NULL 
          AND fn.venda_id IS NULL
          AND EXISTS (SELECT 1 FROM vendas v WHERE v.id = fn.order_id);
        END IF;
      END $$;
    `)

    // Passo 4: Remove coluna comanda_id se existir
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_notes' AND column_name = 'comanda_id'
        ) THEN
          ALTER TABLE fiscal_notes DROP COLUMN comanda_id;
        END IF;
      END $$;
    `)

    // Passo 5: Remove coluna order_id se existir
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'fiscal_notes' AND column_name = 'order_id'
        ) THEN
          ALTER TABLE fiscal_notes DROP COLUMN order_id;
        END IF;
      END $$;
    `)

    // Passo 6: Cria índice para venda_id se não existir
    await this.db.rawQuery(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'fiscal_notes' AND indexname LIKE '%venda_id%'
        ) THEN
          CREATE INDEX fiscal_notes_venda_id_index ON fiscal_notes(venda_id);
        END IF;
      END $$;
    `)
  }

  async down() {
    // Passo 1: Adiciona a coluna comanda_id
    await this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('comanda_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('comandas')
        .onDelete('CASCADE')
    })

    // Passo 2: Restaura dados antes de remover venda_id
    await this.db.rawQuery(`
      UPDATE fiscal_notes fn
      SET comanda_id = (
        SELECT v.comanda_id 
        FROM vendas v 
        WHERE v.id = fn.venda_id 
        LIMIT 1
      )
      WHERE fn.venda_id IS NOT NULL
    `)

    // Passo 3: Remove coluna venda_id (índices são removidos automaticamente)
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('venda_id')
    })

    // Passo 4: Adiciona índice para comanda_id
    await this.schema.alterTable(this.tableName, (table) => {
      table.index(['comanda_id'])
    })
  }
}
