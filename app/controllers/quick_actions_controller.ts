import type { HttpContext } from '@adonisjs/core/http'
import UserQuickAction from '#models/user_quick_action'
import router from '@adonisjs/core/services/router'

export default class QuickActionsController {
  /**
   * Retorna as ações rápidas disponíveis e as preferências do usuário
   */
  async index({ auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Ações rápidas disponíveis no sistema
      const availableActions = [
        {
          key: 'new_order',
          label: 'Novo Pedido',
          icon: 'fa-plus',
          route: 'pedidos.create',
          url: router.makeUrl('pedidos.create'),
          color: 'blue',
        },
        {
          key: 'open_cash',
          label: 'Abrir Caixa',
          icon: 'fa-cash-register',
          route: 'cashRegisters.current',
          url: router.makeUrl('cashRegisters.current'),
          color: 'green',
        },
        {
          key: 'new_product',
          label: 'Novo Produto',
          icon: 'fa-utensils',
          route: 'cardapio_produtos.create',
          url: router.makeUrl('cardapio_produtos.create'),
          color: 'purple',
        },
        {
          key: 'new_category',
          label: 'Nova Categoria',
          icon: 'fa-folder-plus',
          route: 'cardapio_categorias.create',
          url: router.makeUrl('cardapio_categorias.create'),
          color: 'indigo',
        },
        {
          key: 'new_supplier',
          label: 'Novo Fornecedor',
          icon: 'fa-truck',
          route: 'fornecedores.create',
          url: router.makeUrl('fornecedores.create'),
          color: 'orange',
        },
        {
          key: 'new_ingredient',
          label: 'Novo Insumo',
          icon: 'fa-box',
          route: 'insumos.create',
          url: router.makeUrl('insumos.create'),
          color: 'teal',
        },
        {
          key: 'new_table',
          label: 'Nova Mesa',
          icon: 'fa-table',
          route: 'comandas.create',
          url: router.makeUrl('comandas.create'),
          color: 'pink',
        },
        {
          key: 'reports',
          label: 'Relatórios',
          icon: 'fa-chart-bar',
          route: 'vendas.reports',
          url: router.makeUrl('vendas.reports'),
          color: 'amber',
        },
        {
          key: 'kitchen',
          label: 'Cozinha',
          icon: 'fa-fire',
          route: 'pedidos.kitchen',
          url: router.makeUrl('pedidos.kitchen'),
          color: 'red',
        },
      ] // Buscar preferências do usuário
      const userActions = await UserQuickAction.query()
        .where('userId', user.id)
        .orderBy('sortOrder', 'asc')

      // Se usuário não tem preferências, criar com padrões
      if (userActions.length === 0) {
        const defaultActions = ['new_order', 'open_cash', 'new_product', 'reports']

        for (const [i, defaultAction] of defaultActions.entries()) {
          await UserQuickAction.create({
            userId: user.id,
            actionKey: defaultAction,
            enabled: true,
            sortOrder: i,
          })
        }

        // Recarregar
        const newUserActions = await UserQuickAction.query()
          .where('userId', user.id)
          .orderBy('sortOrder', 'asc')

        return response.json({
          availableActions,
          userActions: newUserActions.map((ua) => ua.serialize()),
        })
      }

      return response.json({
        availableActions,
        userActions: userActions.map((ua) => ua.serialize()),
      })
    } catch (error) {
      console.error('Erro em quick-actions index:', error)
      return response.status(500).json({
        error: 'Erro ao carregar ações rápidas',
        message: error.message,
      })
    }
  }

  /**
   * Atualiza as preferências de ações rápidas do usuário
   */
  async update({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const { actions } = request.only(['actions'])

      // Validar que actions é um array
      if (!Array.isArray(actions)) {
        return response.badRequest({ error: 'Actions deve ser um array' })
      }

      // Deletar todas as ações existentes
      await UserQuickAction.query().where('userId', user.id).delete()

      // Criar novas ações
      for (const [i, action] of actions.entries()) {
        await UserQuickAction.create({
          userId: user.id,
          actionKey: action.key,
          enabled: action.enabled !== false,
          sortOrder: i,
        })
      }

      return response.json({ success: true, message: 'Ações rápidas atualizadas com sucesso' })
    } catch (error) {
      console.error('Erro em quick-actions update:', error)
      return response.status(500).json({
        error: 'Erro ao atualizar ações rápidas',
        message: error.message,
      })
    }
  }
}
