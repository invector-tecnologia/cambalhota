import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // 1. Renomear company_id → empresa_id em múltiplas tabelas
    await this.renameIfExists('comandas', 'company_id', 'empresa_id')
    await this.renameIfExists('pedidos', 'company_id', 'empresa_id')
    await this.renameIfExists('vendas', 'company_id', 'empresa_id')
    await this.renameIfExists('cardapio_categorias', 'company_id', 'empresa_id')
    await this.renameIfExists('cardapio_produtos', 'company_id', 'empresa_id')
    await this.renameIfExists('insumos', 'company_id', 'empresa_id')
    await this.renameIfExists('fornecedores', 'company_id', 'empresa_id')
    await this.renameIfExists('notas_fiscais', 'company_id', 'empresa_id')
    await this.renameIfExists('caixa_registros', 'company_id', 'empresa_id')
    await this.renameIfExists('cardapios_virtuais', 'company_id', 'empresa_id')

    // 2. Renomear table_id → comanda_id
    await this.renameIfExists('pedidos', 'table_id', 'comanda_id')
    await this.renameIfExists('vendas', 'table_id', 'comanda_id')

    // 3. Renomear order_id → pedido_id
    await this.renameIfExists('vendas', 'order_id', 'pedido_id')
    await this.renameIfExists('pedido_itens', 'order_id', 'pedido_id')

    // 4. Renomear menu_item_id → cardapio_produto_id
    await this.renameIfExists('pedido_itens', 'menu_item_id', 'cardapio_produto_id')
    await this.renameIfExists('venda_itens', 'menu_item_id', 'cardapio_produto_id')
    await this.renameIfExists(
      'cardapio_produtos_ingredientes',
      'menu_item_id',
      'cardapio_produto_id'
    )

    // 5. Renomear menu_category_id → cardapio_categoria_id
    await this.renameIfExists('cardapio_produtos', 'menu_category_id', 'cardapio_categoria_id')

    // 6. Renomear product_id → insumo_id
    await this.renameIfExists('cardapio_produtos_ingredientes', 'product_id', 'insumo_id')
    await this.renameIfExists('nota_fiscal_itens', 'product_id', 'insumo_id')

    // 7. Renomear supplier_id → fornecedor_id
    await this.renameIfExists('notas_fiscais', 'supplier_id', 'fornecedor_id')
    await this.renameIfExists('insumos', 'default_supplier_id', 'fornecedor_padrao_id')

    // 8. Renomear sale_id → venda_id
    await this.renameIfExists('venda_itens', 'sale_id', 'venda_id')

    // 9. Renomear order_item_id → pedido_item_id
    await this.renameIfExists('venda_itens', 'order_item_id', 'pedido_item_id')

    // 10. Renomear nfe_id → nota_fiscal_id
    await this.renameIfExists('nota_fiscal_itens', 'nfe_id', 'nota_fiscal_id')
  }

  async down() {
    // Reverter todas as alterações
    await this.schema.alterTable('nota_fiscal_itens', (table) => {
      table.renameColumn('nota_fiscal_id', 'nfe_id')
    })
    await this.schema.alterTable('venda_itens', (table) => {
      table.renameColumn('pedido_item_id', 'order_item_id')
    })
    await this.schema.alterTable('venda_itens', (table) => {
      table.renameColumn('venda_id', 'sale_id')
    })
    await this.schema.alterTable('insumos', (table) => {
      table.renameColumn('fornecedor_padrao_id', 'default_supplier_id')
    })
    await this.schema.alterTable('notas_fiscais', (table) => {
      table.renameColumn('fornecedor_id', 'supplier_id')
    })
    await this.schema.alterTable('nota_fiscal_itens', (table) => {
      table.renameColumn('insumo_id', 'product_id')
    })
    await this.schema.alterTable('cardapio_produtos_ingredientes', (table) => {
      table.renameColumn('insumo_id', 'product_id')
    })
    await this.schema.alterTable('cardapio_produtos', (table) => {
      table.renameColumn('cardapio_categoria_id', 'menu_category_id')
    })
    await this.schema.alterTable('cardapio_produtos_ingredientes', (table) => {
      table.renameColumn('cardapio_produto_id', 'menu_item_id')
    })
    await this.schema.alterTable('venda_itens', (table) => {
      table.renameColumn('cardapio_produto_id', 'menu_item_id')
    })
    await this.schema.alterTable('pedido_itens', (table) => {
      table.renameColumn('cardapio_produto_id', 'menu_item_id')
    })
    await this.schema.alterTable('pedido_itens', (table) => {
      table.renameColumn('pedido_id', 'order_id')
    })
    await this.schema.alterTable('vendas', (table) => {
      table.renameColumn('pedido_id', 'order_id')
    })
    await this.schema.alterTable('vendas', (table) => {
      table.renameColumn('comanda_id', 'table_id')
    })
    await this.schema.alterTable('pedidos', (table) => {
      table.renameColumn('comanda_id', 'table_id')
    })
    await this.schema.alterTable('cardapios_virtuais', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('caixa_registros', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('notas_fiscais', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('fornecedores', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('insumos', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('cardapio_produtos', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('cardapio_categorias', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('vendas', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('pedidos', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
    await this.schema.alterTable('comandas', (table) => {
      table.renameColumn('empresa_id', 'company_id')
    })
  }

  private async renameIfExists(tableName: string, oldColumn: string, newColumn: string) {
    const hasOldColumn = await this.db.rawQuery(
      `SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = ?`,
      [tableName, oldColumn]
    )
    if (hasOldColumn.rows.length > 0) {
      await this.schema.alterTable(tableName, (table) => {
        table.renameColumn(oldColumn, newColumn)
      })
    }
  }
}
