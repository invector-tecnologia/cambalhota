/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Rota pública (homepage)
router.get('/', '#controllers/home_controller.index').as('home')
router
  .post('/contato-comercial', '#controllers/home_controller.submitCommercialContact')
  .as('home.contact')

// Rotas de autenticação
router
  .group(() => {
    router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login')
    router.post('/login', '#controllers/auth_controller.login')
    router.get('/register', '#controllers/auth_controller.showRegister').as('auth.register')
    router.post('/register', '#controllers/auth_controller.register')
    router
      .get('/forgot-password', '#controllers/auth_controller.showForgotPassword')
      .as('auth.forgot_password')
    router.post('/forgot-password', '#controllers/auth_controller.forgotPassword')
  })
  .middleware(middleware.guest())

// Verificação de email (pública)
router
  .get('/verify-email/:token', '#controllers/auth_controller.verifyEmail')
  .as('auth.verify_email')

// Reenviar verificação (protegida)
router
  .post('/resend-verification', '#controllers/auth_controller.resendVerification')
  .as('auth.resend_verification')
  .middleware(middleware.auth())

// Logout (acessível apenas para usuários logados)
router
  .post('/logout', '#controllers/auth_controller.logout')
  .as('auth.logout')
  .middleware(middleware.auth())

// Página de offline (pública)
router.get('/offline', '#controllers/home_controller.offline').as('offline')

// Rotas protegidas
router
  .group(() => {
    // Dashboard
    router.get('/dashboard', '#controllers/dashboard_controller.index').as('dashboard.index')
    router
      .get(
        '/api/dashboard/product-availability',
        '#controllers/dashboard_controller.getProductAvailability'
      )
      .as('dashboard.productAvailability')
    router
      .get('/api/dashboard/debug-charts', '#controllers/dashboard_controller.debugCharts')
      .as('dashboard.debugCharts')

    // Configurações
    router
      .get('/configuracoes/usuario', '#controllers/configuracoes_controller.editUser')
      .as('configuracoes.editUser')
    router
      .put('/configuracoes/usuario', '#controllers/configuracoes_controller.updateUser')
      .as('configuracoes.updateUser')
    router
      .post('/configuracoes/usuario', '#controllers/configuracoes_controller.updateUser')
      .as('configuracoes.updateUser.post')
    router
      .get('/configuracoes/empresa', '#controllers/configuracoes_controller.editEmpresa')
      .as('configuracoes.editEmpresa')
    router
      .put('/configuracoes/empresa', '#controllers/configuracoes_controller.updateEmpresa')
      .as('configuracoes.updateEmpresa')
    router
      .post('/configuracoes/empresa', '#controllers/configuracoes_controller.updateEmpresa')
      .as('configuracoes.updateEmpresa.post')

    // Configurações de Voz (BYOK OpenAI)
    router
      .get('/configuracoes/voz', '#controllers/voice_config_controller.edit')
      .as('configuracoes.editVoz')
    router
      .post('/configuracoes/voz', '#controllers/voice_config_controller.update')
      .as('configuracoes.updateVoz')
    router
      .post('/configuracoes/voz/testar', '#controllers/voice_config_controller.testKey')
      .as('configuracoes.testVozKey')

    // Voice Ordering — Pedidos por Voz
    router.get('/voz', '#controllers/voice_ordering_controller.page').as('voice.index')
    router
      .post('/api/voice/preview', '#controllers/voice_ordering_controller.preview')
      .as('voice.preview')
    router
      .post('/api/voice/confirm', '#controllers/voice_ordering_controller.confirm')
      .as('voice.confirm')
    router
      .get('/api/voice/status', '#controllers/voice_ordering_controller.status')
      .as('voice.status')

    // Guias
    router.get('/guias', '#controllers/guides_controller.index').as('guides.index')
    router.get('/guias/:slug', '#controllers/guides_controller.show').as('guides.show')

    // Relatórios
    router.get('/reports', '#controllers/reports_controller.index').as('reports.index')

    // API - Venda fiscal status (AJAX polling)
    router
      .get('/api/vendas/:id/fiscal-note', '#controllers/vendas_fiscal_controller.fiscalNoteStatus')
      .as('vendas.fiscalNoteStatus')

    // Quick Actions
    router
      .get('/quick-actions', '#controllers/quick_actions_controller.index')
      .as('quickActions.index')
    router
      .post('/quick-actions', '#controllers/quick_actions_controller.update')
      .as('quickActions.update')

    // Almoxarifado - Fornecedores
    router
      .get('/almoxarifado/fornecedores', '#controllers/fornecedores_controller.index')
      .as('fornecedores.index')
    router
      .get('/almoxarifado/fornecedores/novo', '#controllers/fornecedores_controller.create')
      .as('fornecedores.create')
    router
      .post('/almoxarifado/fornecedores', '#controllers/fornecedores_controller.store')
      .as('fornecedores.store')
    router
      .get('/almoxarifado/fornecedores/:id', '#controllers/fornecedores_controller.show')
      .as('fornecedores.show')
    router
      .get('/almoxarifado/fornecedores/:id/editar', '#controllers/fornecedores_controller.edit')
      .as('fornecedores.edit')
    router
      .put('/almoxarifado/fornecedores/:id', '#controllers/fornecedores_controller.update')
      .as('fornecedores.update')
    router
      .post('/almoxarifado/fornecedores/:id', '#controllers/fornecedores_controller.update')
      .as('fornecedores.update.post')
    router
      .delete('/almoxarifado/fornecedores/:id', '#controllers/fornecedores_controller.destroy')
      .as('fornecedores.destroy')

    // Almoxarifado - Insumos
    router.get('/almoxarifado/insumos', '#controllers/insumos_controller.index').as('insumos.index')
    router
      .get('/almoxarifado/insumos/novo', '#controllers/insumos_controller.create')
      .as('insumos.create')
    router
      .post('/almoxarifado/insumos', '#controllers/insumos_controller.store')
      .as('insumos.store')
    router
      .get('/almoxarifado/insumos/:id', '#controllers/insumos_controller.show')
      .as('insumos.show')
    router
      .get('/almoxarifado/insumos/:id/editar', '#controllers/insumos_controller.edit')
      .as('insumos.edit')
    router
      .put('/almoxarifado/insumos/:id', '#controllers/insumos_controller.update')
      .as('insumos.update')
    router
      .post('/almoxarifado/insumos/:id', '#controllers/insumos_controller.update')
      .as('insumos.update.post')
    router
      .delete('/almoxarifado/insumos/:id', '#controllers/insumos_controller.destroy')
      .as('insumos.destroy')
    router
      .put('/almoxarifado/insumos/:id/estoque', '#controllers/insumos_controller.updateStock')
      .as('insumos.updateStock')
    router
      .post('/almoxarifado/insumos/:id/estoque', '#controllers/insumos_controller.updateStock')
      .as('insumos.updateStock.post')

    // Almoxarifado - NFes
    router
      .get('/almoxarifado/nfes', '#controllers/notas_fiscais_controller.index')
      .as('notas_fiscais.index')
    router
      .get('/almoxarifado/nfes/importar', '#controllers/notas_fiscais_controller.create')
      .as('notas_fiscais.create')
    router
      .post('/almoxarifado/nfes', '#controllers/notas_fiscais_controller.store')
      .as('notas_fiscais.store')
    router
      .get('/almoxarifado/nfes/:id', '#controllers/notas_fiscais_controller.show')
      .as('notas_fiscais.show')
    router
      .post(
        '/almoxarifado/nfes/:id/estoque',
        '#controllers/notas_fiscais_controller.applyStockEntry'
      )
      .as('notas_fiscais.applyStockEntry')
    router
      .post('/almoxarifado/nfes/:id/reprocessar', '#controllers/notas_fiscais_controller.reprocess')
      .as('notas_fiscais.reprocess')
    router
      .delete('/almoxarifado/nfes/:id', '#controllers/notas_fiscais_controller.destroy')
      .as('notas_fiscais.destroy')

    // Cardápio - Categorias
    router
      .get('/cardapio/categorias', '#controllers/cardapio_categorias_controller.index')
      .as('cardapio_categorias.index')
    router
      .get('/cardapio/categorias/nova', '#controllers/cardapio_categorias_controller.create')
      .as('cardapio_categorias.create')
    router
      .post('/cardapio/categorias', '#controllers/cardapio_categorias_controller.store')
      .as('cardapio_categorias.store')
    router
      .get('/cardapio/categorias/:id', '#controllers/cardapio_categorias_controller.show')
      .as('cardapio_categorias.show')
    router
      .get('/cardapio/categorias/:id/editar', '#controllers/cardapio_categorias_controller.edit')
      .as('cardapio_categorias.edit')
    router
      .put('/cardapio/categorias/:id', '#controllers/cardapio_categorias_controller.update')
      .as('cardapio_categorias.update')
    router
      .post('/cardapio/categorias/:id', '#controllers/cardapio_categorias_controller.update')
      .as('cardapio_categorias.update.post')
    router
      .delete(
        '/cardapio/categorias/:id/deletar',
        '#controllers/cardapio_categorias_controller.destroy'
      )
      .as('cardapio_categorias.destroy')
    router
      .post(
        '/cardapio/categorias/:id/deletar',
        '#controllers/cardapio_categorias_controller.destroy'
      )
      .as('cardapio_categorias.destroy.post')
    router
      .post(
        '/cardapio/categorias/:id/toggle',
        '#controllers/cardapio_categorias_controller.toggleActive'
      )
      .as('cardapio_categorias.toggleActive')
    router
      .post('/cardapio/categorias/ordem', '#controllers/cardapio_categorias_controller.updateOrder')
      .as('cardapio_categorias.updateOrder')

    // Cardápio - Produtos
    router
      .get('/cardapio/produtos', '#controllers/cardapio_produtos_controller.index')
      .as('cardapio_produtos.index')
    router
      .get('/cardapio/produtos/novo', '#controllers/cardapio_produtos_controller.create')
      .as('cardapio_produtos.create')
    router
      .post('/cardapio/produtos', '#controllers/cardapio_produtos_controller.store')
      .as('cardapio_produtos.store')
    router
      .get('/cardapio/produtos/:id/imagem', '#controllers/cardapio_produtos_controller.image')
      .as('cardapio_produtos.image')
    router
      .get('/cardapio/produtos/:id', '#controllers/cardapio_produtos_controller.show')
      .as('cardapio_produtos.show')
    router
      .get('/cardapio/produtos/:id/editar', '#controllers/cardapio_produtos_controller.edit')
      .as('cardapio_produtos.edit')
    router
      .put('/cardapio/produtos/:id', '#controllers/cardapio_produtos_controller.update')
      .as('cardapio_produtos.update')
    router
      .post('/cardapio/produtos/:id', '#controllers/cardapio_produtos_controller.update')
      .as('cardapio_produtos.update.post')
    router
      .delete('/cardapio/produtos/:id/deletar', '#controllers/cardapio_produtos_controller.destroy')
      .as('cardapio_produtos.destroy')
    router
      .post('/cardapio/produtos/:id/deletar', '#controllers/cardapio_produtos_controller.destroy')
      .as('cardapio_produtos.destroy.post')
    router
      .post(
        '/cardapio/produtos/:id/ingrediente',
        '#controllers/cardapio_produtos_controller.addIngredient'
      )
      .as('cardapio_produtos.addIngredient')
    router
      .delete(
        '/cardapio/produtos/:itemId/ingrediente/:ingredientId',
        '#controllers/cardapio_produtos_controller.removeIngredient'
      )
      .as('cardapio_produtos.removeIngredient')
    router
      .post(
        '/cardapio/produtos/:id/calcular-preco',
        '#controllers/cardapio_produtos_controller.calculatePrice'
      )
      .as('cardapio_produtos.calculatePrice')
    router
      .post(
        '/cardapio/produtos/:id/toggle',
        '#controllers/cardapio_produtos_controller.toggleAvailable'
      )
      .as('cardapio_produtos.toggleAvailable')

    // Mesas
    router.get('/mesas', '#controllers/mesas_controller.index').as('mesas.index')
    router.get('/mesas/nova', '#controllers/mesas_controller.create').as('mesas.create')

    // Suporte - Tickets (usuário)
    router
      .get('/suporte/tickets', '#controllers/support_tickets_controller.index')
      .as('supportTickets.index')
    router
      .get('/suporte/tickets/novo', '#controllers/support_tickets_controller.create')
      .as('supportTickets.create')
    router
      .post('/suporte/tickets', '#controllers/support_tickets_controller.store')
      .as('supportTickets.store')
    router
      .get('/suporte/tickets/:id', '#controllers/support_tickets_controller.show')
      .as('supportTickets.show')
    router
      .post('/suporte/tickets/:id/responder', '#controllers/support_tickets_controller.reply')
      .as('supportTickets.reply')
    router
      .post('/suporte/tickets/:id/cancelar', '#controllers/support_tickets_controller.cancel')
      .as('supportTickets.cancel')
    router
      .post(
        '/suporte/tickets/:id/confirmar-solucao',
        '#controllers/support_tickets_controller.confirmSolution'
      )
      .as('supportTickets.confirmSolution')
    router
      .post(
        '/suporte/tickets/:id/nao-resolvido',
        '#controllers/support_tickets_controller.rejectSolution'
      )
      .as('supportTickets.rejectSolution')

    router.post('/mesas', '#controllers/mesas_controller.store').as('mesas.store')
    router.get('/mesas/:id', '#controllers/mesas_controller.show').as('mesas.show')
    router.get('/mesas/:id/editar', '#controllers/mesas_controller.edit').as('mesas.edit')

    router.put('/mesas/:id', '#controllers/mesas_controller.update').as('mesas.update')
    router.post('/mesas/:id', '#controllers/mesas_controller.update').as('mesas.update.post')
    router.delete('/mesas/:id/deletar', '#controllers/mesas_controller.destroy').as('mesas.destroy')
    router
      .post('/mesas/:id/deletar', '#controllers/mesas_controller.destroy')
      .as('mesas.destroy.post')
    router
      .post('/mesas/:id/toggle', '#controllers/mesas_controller.toggleActive')
      .as('mesas.toggleActive')
    router
      .post('/mesas/:id/status', '#controllers/mesas_controller.updateStatus')
      .as('mesas.updateStatus')

    // Comandas
    router.get('/comandas', '#controllers/comandas_controller.index').as('comandas.index')
    router.get('/comandas/nova', '#controllers/comandas_controller.create').as('comandas.create')

    // Funcionários
    router
      .get('/funcionarios', '#controllers/funcionarios_controller.index')
      .as('funcionarios.index')
    router
      .get('/funcionarios/novo', '#controllers/funcionarios_controller.create')
      .as('funcionarios.create')
    router
      .post('/funcionarios', '#controllers/funcionarios_controller.store')
      .as('funcionarios.store')
    router
      .get('/funcionarios/:id', '#controllers/funcionarios_controller.show')
      .as('funcionarios.show')
    router
      .get('/funcionarios/:id/editar', '#controllers/funcionarios_controller.edit')
      .as('funcionarios.edit')
    router
      .put('/funcionarios/:id', '#controllers/funcionarios_controller.update')
      .as('funcionarios.update')
    router
      .post('/funcionarios/:id', '#controllers/funcionarios_controller.update')
      .as('funcionarios.update.post')
    router
      .delete('/funcionarios/:id', '#controllers/funcionarios_controller.destroy')
      .as('funcionarios.destroy')

    // Pedidos (antes das rotas parametrizadas de comandas)
    router.get('/comandas/pedidos', '#controllers/pedidos_controller.index').as('pedidos.index')
    router
      .get('/comandas/pedidos/novo', '#controllers/pedidos_controller.create')
      .as('pedidos.create')
    router.post('/comandas/pedidos', '#controllers/pedidos_controller.store').as('pedidos.store')
    router.get('/comandas/pedidos/:id', '#controllers/pedidos_controller.show').as('pedidos.show')
    router
      .get('/comandas/pedidos/:id/editar', '#controllers/pedidos_controller.edit')
      .as('pedidos.edit')
    router
      .put('/comandas/pedidos/:id', '#controllers/pedidos_controller.update')
      .as('pedidos.update')
    router
      .post('/comandas/pedidos/:id', '#controllers/pedidos_controller.update')
      .as('pedidos.update.post')
    router
      .delete('/comandas/pedidos/:id', '#controllers/pedidos_controller.destroy')
      .as('pedidos.destroy')
    router
      .post('/comandas/pedidos/:id/confirmar', '#controllers/pedidos_controller.confirm')
      .as('pedidos.confirm')
    router
      .post('/comandas/pedidos/:id/cancelar', '#controllers/pedidos_controller.cancel')
      .as('pedidos.cancel')
    router
      .get('/comandas/pedidos/:id/imprimir-cozinha', '#controllers/pedidos_controller.printKitchen')
      .as('pedidos.print.kitchen')
    router
      .post('/comandas/pedidos/:id/status', '#controllers/pedidos_controller.updateStatus')
      .as('pedidos.updateStatus')
    router
      .post('/comandas/pedidos/:id/itens', '#controllers/pedidos_controller.addItem')
      .as('pedidos.addItem')
    router
      .delete('/comandas/pedidos/:id/itens/:itemId', '#controllers/pedidos_controller.removeItem')
      .as('pedidos.removeItem')
    router
      .post(
        '/comandas/pedidos/:id/itens/:itemId/status',
        '#controllers/pedidos_controller.updateItemStatus'
      )
      .as('pedidos.items.updateStatus')
    router
      .patch(
        '/pedidos/:id/items/:itemId/status',
        '#controllers/pedidos_controller.updateItemStatus'
      )
      .as('pedidos.updateItemStatus')

    // Comandas parametrizadas (devem vir por último)
    router.post('/comandas', '#controllers/comandas_controller.store').as('comandas.store')
    router.get('/comandas/:id', '#controllers/comandas_controller.show').as('comandas.show')
    router
      .get('/comandas/:id/imprimir', '#controllers/comandas_controller.print')
      .as('comandas.print')
    router.get('/comandas/:id/editar', '#controllers/comandas_controller.edit').as('comandas.edit')
    router.put('/comandas/:id', '#controllers/comandas_controller.update').as('comandas.update')
    router
      .post('/comandas/:id', '#controllers/comandas_controller.update')
      .as('comandas.update.post')
    router
      .delete('/comandas/:id/deletar', '#controllers/comandas_controller.destroy')
      .as('comandas.destroy')
    router
      .post('/comandas/:id/deletar', '#controllers/comandas_controller.destroy')
      .as('comandas.destroy.post')
    router
      .post('/comandas/:id/toggle', '#controllers/comandas_controller.toggleActive')
      .as('comandas.toggleActive')
    router
      .post('/comandas/:id/fechar', '#controllers/comandas_controller.closeAndPay')
      .as('comandas.closeAndPay')

    // Cozinha
    router.get('/cozinha', '#controllers/pedidos_controller.kitchen').as('pedidos.kitchen')

    // Tema do Dashboard
    router
      .post('/dashboard/tema', '#controllers/dashboard_controller.setTheme')
      .as('dashboard.setTheme')

    // Financeiro - Vendas
    router.get('/financeiro/vendas', '#controllers/vendas_controller.index').as('vendas.index')
    router
      .get('/financeiro/vendas/nova', '#controllers/vendas_controller.create')
      .as('vendas.create')
    router.post('/financeiro/vendas', '#controllers/vendas_controller.store').as('vendas.store')
    router.get('/financeiro/vendas/:id', '#controllers/vendas_controller.show').as('vendas.show')
    router
      .post('/financeiro/vendas/:id/emit-nfce', '#controllers/vendas_fiscal_controller.emitNfce')
      .as('vendas.emitNfce')
    router
      .get('/financeiro/vendas/:id/imprimir', '#controllers/vendas_controller.print')
      .as('vendas.print')
    router
      .get('/financeiro/vendas/:id/nfe/imprimir', '#controllers/vendas_fiscal_controller.printNfe')
      .as('vendas.nfe.print')
    router
      .get('/financeiro/dashboard', '#controllers/vendas_reports_controller.dashboard')
      .as('vendas.dashboard')
    router
      .get('/financeiro/relatorios', '#controllers/vendas_reports_controller.reports')
      .as('vendas.reports')

    // Fiscal - Páginas (UI)
    router.get('/fiscal', '#controllers/fiscal_pages_controller.index').as('fiscal.pages.index')

    // Fiscal - Configuração (UI Web)
    router
      .get('/config/fiscal', '#controllers/fiscal_config_controller.showConfigPage')
      .as('fiscal.config.page.index')
    router
      .get('/config/fiscal/create', '#controllers/fiscal_config_controller.createConfigPage')
      .as('fiscal.config.page.create')
    router
      .get('/config/fiscal/edit', '#controllers/fiscal_config_controller.editConfigPage')
      .as('fiscal.config.page.edit')
    router
      .post('/config/fiscal', '#controllers/fiscal_config_controller.storeConfigPage')
      .as('fiscal.config.page.store')
    router
      .put('/config/fiscal', '#controllers/fiscal_config_controller.updateConfigPage')
      .as('fiscal.config.page.update')
    router
      .post('/config/fiscal/update', '#controllers/fiscal_config_controller.updateConfigPage')
      .as('fiscal.config.page.update.post')
    router
      .delete('/config/fiscal', '#controllers/fiscal_config_controller.destroyConfigPage')
      .as('fiscal.config.page.destroy')
    router
      .post('/config/fiscal/delete', '#controllers/fiscal_config_controller.destroyConfigPage')
      .as('fiscal.config.page.destroy.post')
    router
      .get(
        '/api/fiscal/suggest-next-number',
        '#controllers/fiscal_config_controller.suggestNextNumber'
      )
      .as('fiscal.config.suggestNextNumber')

    // Financeiro - Controle de Caixa
    router
      .get('/financeiro/caixa', '#controllers/caixa_registros_controller.index')
      .as('cashRegisters.index')
    router
      .get('/financeiro/caixa/atual', '#controllers/caixa_registros_controller.current')
      .as('cashRegisters.current')
    router
      .post('/financeiro/caixa/abrir', '#controllers/caixa_registros_controller.open')
      .as('cashRegisters.open')
    router
      .post('/financeiro/caixa/:id/fechar', '#controllers/caixa_registros_controller.close')
      .as('cashRegisters.close')
    router
      .get('/financeiro/caixa/:id', '#controllers/caixa_registros_controller.show')
      .as('cashRegisters.show')
    router
      .get('/financeiro/caixa/:id/imprimir', '#controllers/caixa_registros_controller.print')
      .as('cashRegisters.print')
    router
      .post(
        '/financeiro/caixa/:id/atualizar-vendas',
        '#controllers/caixa_registros_controller.updateSales'
      )
      .as('cashRegisters.updateSales')
    router
      .get(
        '/api/financeiro/caixa/atual/dados',
        '#controllers/caixa_registros_controller.currentData'
      )
      .as('cashRegisters.currentData')
    router
      .get('/financeiro/movimento', '#controllers/caixa_registros_controller.movement')
      .as('cashRegisters.movement')

    // API routes
    router.get('/api/suppliers', '#controllers/fornecedores_controller.api').as('api.suppliers')
    router.get('/api/supplies', '#controllers/insumos_controller.api').as('api.supplies')
    router
      .get('/api/nfes/stats', '#controllers/notas_fiscais_controller.stats')
      .as('api.nfes.stats')
    router
      .get('/api/menu/categories', '#controllers/cardapio_categorias_controller.api')
      .as('api.cardapio_categories')
    router
      .get('/api/menu/items', '#controllers/cardapio_produtos_controller.api')
      .as('api.cardapio_items')
    router.get('/api/tables', '#controllers/comandas_controller.api').as('api.tables')
    router.get('/api/orders/stats', '#controllers/pedidos_controller.stats').as('api.orders.stats')

    // API IBGE - Consulta de municípios
    router
      .get('/api/ibge/municipio', '#controllers/ibge_api_controller.getMunicipio')
      .as('api.ibge.municipio')
    router
      .get('/api/ibge/municipios', '#controllers/ibge_api_controller.listMunicipios')
      .as('api.ibge.municipios')
    router
      .get('/api/sales/stats', '#controllers/vendas_reports_controller.stats')
      .as('api.sales.stats')
    router
      .get('/api/cash-registers/stats', '#controllers/caixa_registros_controller.stats')
      .as('api.cashRegisters.stats')
    router
      .get('/api/mesas/:id/status', '#controllers/mesas_controller.getStatus')
      .as('api.mesas.status')

    // Admin - Logs (Cloudflare R2)
    router
      .get('/admin/logs/upload-now', '#controllers/admin_logs_controller.uploadNow')
      .as('admin.logs.uploadNow')
      .middleware(middleware.superadmin())
    router
      .get('/admin/logs/latest', '#controllers/admin_logs_controller.latest')
      .as('admin.logs.latest')
      .middleware(middleware.superadmin())

    // Heroku Log Drain (público, sem autenticação)
    router
      .post('/logs/drain', '#controllers/log_drain_controller.receive')
      .as('logs.drain')
      .middleware([]) // Sem middleware de auth para receber do Heroku

    //////////////////////////////////////////////////////////////////
    // Rotas de teste (para debug)
    //////////////////////////////////////////////////////////////////
    router.get('/test', '#controllers/test_controller.index').as('test.index')
    router
      .get('/test/auto-login/:email', '#controllers/test_controller.autoLogin')
      .as('test.autoLogin')
    router
      .get('/test/clear-session', '#controllers/test_controller.clearSession')
      .as('test.clearSession')
    router.get('/test/force-500', '#controllers/test_controller.force500').as('test.force500')
    router
      .get('/edge-test/simple', '#controllers/edge_test_controller.simple')
      .as('edgeTest.simple')
    router
      .get('/edge-test/layout', '#controllers/edge_test_controller.withLayout')
      .as('edgeTest.layout')
    router
      .get('/edge-test/dashboard', '#controllers/edge_test_controller.dashboard')
      .as('edgeTest.dashboard')
    router.get('/edge-test/info', '#controllers/edge_test_controller.edgeInfo').as('edgeTest.info')

    // Cardápios Virtuais (Admin)
    router
      .get('/cardapio-virtual', '#controllers/cardapios_virtuais_controller.index')
      .as('cardapios_virtuais.index')
    router
      .get('/cardapio-virtual/novo', '#controllers/cardapios_virtuais_controller.create')
      .as('cardapios_virtuais.create')
    router
      .post('/cardapio-virtual', '#controllers/cardapios_virtuais_controller.store')
      .as('cardapios_virtuais.store')
    router
      .get('/cardapio-virtual/:id', '#controllers/cardapios_virtuais_controller.show')
      .as('cardapios_virtuais.show')
    router
      .get('/cardapio-virtual/:id/editar', '#controllers/cardapios_virtuais_controller.edit')
      .as('cardapios_virtuais.edit')
    router
      .put('/cardapio-virtual/:id', '#controllers/cardapios_virtuais_controller.update')
      .as('cardapios_virtuais.update')
    router
      .post('/cardapio-virtual/:id', '#controllers/cardapios_virtuais_controller.update')
      .as('cardapios_virtuais.update.post')
    router
      .post(
        '/cardapio-virtual/:id/publicar',
        '#controllers/cardapios_virtuais_controller.togglePublish'
      )
      .as('cardapios_virtuais.togglePublish')
    router
      .delete('/cardapio-virtual/:id/deletar', '#controllers/cardapios_virtuais_controller.destroy')
      .as('cardapios_virtuais.destroy')
    router
      .post('/cardapio-virtual/:id/deletar', '#controllers/cardapios_virtuais_controller.destroy')
      .as('cardapios_virtuais.destroy.post')
  })
  .middleware(middleware.auth())

// Rotas de Configuração (autenticadas)
router
  .group(() => {
    // Configurações de impressão
    router.get('/impressao', '#controllers/print_config_controller.index').as('print-config.index')
    router
      .post('/impressao', '#controllers/print_config_controller.update')
      .as('print-config.update')
    router
      .get('/impressao/logo', '#controllers/print_config_controller.logo')
      .as('print-config.logo')
  })
  .prefix('/config')
  .middleware(middleware.auth())

// Área administrativa (apenas superadmins)
router
  .group(() => {
    // Dashboard
    router.get('/', '#controllers/admin_controller.index').as('admin.index')

    // Alterar senha de usuário (específica)
    router
      .get('/users/:id/change-password', '#controllers/admin_controller.showChangePassword')
      .as('admin.users.change_password')
    router.post('/users/:id/change-password', '#controllers/admin_controller.changePassword')

    // Teste de Cloudflare Images (apenas superadmin)
    router.get('/images/test', '#controllers/images_controller.testUpload').as('admin.images.test')
    router.get('/images/env', '#controllers/images_controller.env').as('admin.images.env')

    // Suporte - Tickets (admin)
    router
      .get('/support-tickets', '#controllers/admin_support_tickets_controller.index')
      .as('admin.supportTickets.index')
    router
      .get('/support-tickets/:id', '#controllers/admin_support_tickets_controller.show')
      .as('admin.supportTickets.show')
    router
      .post('/support-tickets/:id/reply', '#controllers/admin_support_tickets_controller.reply')
      .as('admin.supportTickets.reply')
    router
      .post(
        '/support-tickets/:id/suggest-solution',
        '#controllers/admin_support_tickets_controller.suggestSolution'
      )
      .as('admin.supportTickets.suggestSolution')

    // Rotas mais específicas primeiro (create e edit)
    router.get('/:model/create', '#controllers/admin_controller.create').as('admin.create')
    router.get('/:model/:id/edit', '#controllers/admin_controller.edit').as('admin.edit')

    // CRUD operations - POST também precisa aceitar /:model/:id para method spoofing
    router.post('/:model', '#controllers/admin_controller.store').as('admin.store')
    router.post('/:model/:id', '#controllers/admin_controller.update').as('admin.update.post')
    router.put('/:model/:id', '#controllers/admin_controller.update').as('admin.update')

    // Delete individual
    router.delete('/:model/:id', '#controllers/admin_controller.destroy').as('admin.destroy')

    // Show e list por último (mais genéricas)
    router.get('/:model/:id', '#controllers/admin_controller.show').as('admin.show')
    router.get('/:model', '#controllers/admin_controller.list').as('admin.list')
    // ========================================================================
    // Rotas de Reprocessamento de Dados
    // ========================================================================
    router
      .get('/processing', '#controllers/processing_admin_controller.dashboard')
      .as('processing.dashboard')
    router
      .get('/processing/:entityType/:entityId', '#controllers/processing_admin_controller.show')
      .as('processing.show')
    router
      .post(
        '/processing/:entityType/:entityId/reprocess',
        '#controllers/processing_admin_controller.reprocess'
      )
      .as('processing.reprocess')
    router
      .post(
        '/processing/batch/reprocess',
        '#controllers/processing_admin_controller.batchReprocess'
      )
      .as('processing.batchReprocess')

    // Gestão de regras de processamento
    router
      .get('/processing-rules', '#controllers/processing_admin_controller.rulesIndex')
      .as('processing.rulesIndex')
    router
      .get('/processing-rules/create', '#controllers/processing_admin_controller.createRule')
      .as('processing.createRule')
    router
      .post('/processing-rules', '#controllers/processing_admin_controller.storeRule')
      .as('processing.storeRule')
    router
      .get('/processing-rules/:id/edit', '#controllers/processing_admin_controller.editRule')
      .as('processing.editRule')
    router
      .put('/processing-rules/:id', '#controllers/processing_admin_controller.updateRule')
      .as('processing.updateRule')
    router
      .delete('/processing-rules/:id', '#controllers/processing_admin_controller.deleteRule')
      .as('processing.deleteRule')
  })
  .prefix('/admin')
  .middleware([middleware.auth(), middleware.superadmin(), middleware.adminDebug()])

// Rota pública para visualizar cardápio virtual
router
  .get('/cardapio/:slug', '#controllers/cardapios_virtuais_controller.public')
  .as('cardapios_virtuais.public')

// Rota pública para imagens de produtos (usada no cardápio público)
router
  .get('/produto/:id/imagem', '#controllers/cardapio_produtos_controller.image')
  .as('produto.image')

// ============================================================================
// Rotas do Módulo Fiscal (Tavolo Fiscal Engine)
// ============================================================================
router
  .group(() => {
    // Configurações fiscais
    router
      .post('/config', '#controllers/fiscal_controller.configureEstablishment')
      .as('fiscal.config.store')
    router.get('/config', '#controllers/fiscal_controller.getConfig').as('fiscal.config.show')

    // Emissão de NFC-e
    router.post('/emit', '#controllers/fiscal_controller.emit').as('fiscal.emit')

    // Gestão de notas fiscais
    router.get('/notes', '#controllers/fiscal_controller.listNotes').as('fiscal.notes.list')
    router
      .get('/status/:id', '#controllers/fiscal_controller.queryStatus')
      .as('fiscal.notes.status')
    router.post('/cancel/:id', '#controllers/fiscal_controller.cancel').as('fiscal.notes.cancel')

    // Reprocessamento de notas pendentes
    router
      .get('/pending-notes', '#controllers/fiscal_controller.listPendingNotes')
      .as('fiscal.notes.pending')
    router
      .post('/notes/:id/retry', '#controllers/fiscal_controller.retryEmissionNote')
      .as('fiscal.notes.retry')

    // Download de documentos
    router.get('/danfe/:id', '#controllers/fiscal_controller.getDanfe').as('fiscal.danfe.download')
    router.get('/xml/:id', '#controllers/fiscal_controller.getXml').as('fiscal.xml.download')

    // Exportação para contabilidade (UC23)
    router
      .get('/export-accounting', '#controllers/fiscal_controller.exportAccounting')
      .as('fiscal.export.accounting')
    router
      .get('/export-accounting.zip', '#controllers/fiscal_controller.exportAccountingZip')
      .as('fiscal.export.accountingZip')
    router.get('/notes/:id', '#controllers/fiscal_controller.showNote').as('fiscal.notes.show')
  })
  .prefix('/api/fiscal')
  .middleware(middleware.auth())
