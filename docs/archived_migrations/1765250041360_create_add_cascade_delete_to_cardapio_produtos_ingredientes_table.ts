import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cardapio_produtos_ingredientes'

  async up() {
    await this.schema.raw(`
      DO $$ 
      BEGIN
        -- Verificar e remover constraint antiga se existir
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'cardapio_produtos_ingredientes_cardapio_produto_id_foreign'
          AND table_name = 'cardapio_produtos_ingredientes'
        ) THEN
          ALTER TABLE cardapio_produtos_ingredientes 
          DROP CONSTRAINT cardapio_produtos_ingredientes_cardapio_produto_id_foreign;
        END IF;

        -- Verificar e remover constraint com nome antigo se existir
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'cardapio_product_ingredients_menu_item_id_foreign'
          AND table_name = 'cardapio_produtos_ingredientes'
        ) THEN
          ALTER TABLE cardapio_produtos_ingredientes 
          DROP CONSTRAINT cardapio_product_ingredients_menu_item_id_foreign;
        END IF;

        -- Adicionar constraint com CASCADE
        ALTER TABLE cardapio_produtos_ingredientes
        ADD CONSTRAINT cardapio_produtos_ingredientes_cardapio_produto_id_foreign
        FOREIGN KEY (cardapio_produto_id)
        REFERENCES cardapio_produtos(id)
        ON DELETE CASCADE;
      END $$;
    `)
  }

  async down() {
    await this.schema.raw(`
      ALTER TABLE cardapio_produtos_ingredientes
      DROP CONSTRAINT IF EXISTS cardapio_produtos_ingredientes_cardapio_produto_id_foreign;
      
      ALTER TABLE cardapio_produtos_ingredientes
      ADD CONSTRAINT cardapio_produtos_ingredientes_cardapio_produto_id_foreign
      FOREIGN KEY (cardapio_produto_id)
      REFERENCES cardapio_produtos(id);
    `)
  }
}
