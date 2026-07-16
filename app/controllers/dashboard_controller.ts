import type { HttpContext } from '@adonisjs/core/http'
import Pedido from '#models/pedido'
import Mesa from '#models/mesa'
import Comanda from '#models/comanda'
import CardapioProduto from '#models/cardapio_produto'
import Fornecedor from '#models/fornecedor'
import Insumo from '#models/insumo'
import Venda from '#models/venda'
import SuporteMensagem from '#models/suporte_mensagem'
import { DateTime } from 'luxon'
import { extractCount, extractSum, extractAgg } from '#helpers/db_agg'
import { resolveUserTimezone } from '#helpers/timezone'
import insumoStockService from '#services/insumo_stock_service'

export default class DashboardController {
  /**
   * Exibir dashboard principal
   */
  async index({ auth, view, response, logger, request }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      await user.load('empresa')
      await user.load('role')
      const stateUf = user.empresa?.state?.trim().toUpperCase() || null
      const timezone = resolveUserTimezone({ request }, stateUf)
      if (!stateUf) {
        logger.warn('[DASHBOARD] Empresa sem UF cadastrada; aplicando timezone padrão.')
      }
      logger.info(`[DASHBOARD] Timezone resolvido | uf=${stateUf || 'N/A'} | tz=${timezone}`)

      logger.info(`[DASHBOARD] User ${user.id} accessing dashboard | Role: ${user.role?.name}`)

      // Buscar estatísticas (zonado para Brasil)
      const dayStart = DateTime.now().setZone(timezone).startOf('day')
      const dayEnd = dayStart.plus({ days: 1 })
      const dayStartSql = dayStart.toSQL()
      const dayEndSql = dayEnd.toSQL()
      if (!dayStartSql || !dayEndSql) {
        throw new Error('Não foi possível calcular o intervalo de hoje no timezone Brasil.')
      }

      // Pedidos hoje
      const todayOrders = await Pedido.query()
        .where('empresa_id', user.empresaId)
        .where('created_at', '>=', dayStartSql)
        .where('created_at', '<', dayEndSql)
        .count('* as total')

      // Pedidos pendentes
      const pendingOrders = await Pedido.query()
        .where('empresa_id', user.empresaId)
        .whereIn('status', ['pending', 'confirmed', 'preparing'])
        .count('* as total')

      // Comandas ativas
      const activeComandas = await Comanda.query()
        .where('empresa_id', user.empresaId)
        .where('active', true)
        .count('* as total')

      // Mesas
      const activeTables = await Mesa.query()
        .where('empresa_id', user.empresaId)
        .where('status', 'occupied')
        .count('* as total')

      const totalTables = await Mesa.query()
        .where('empresa_id', user.empresaId)
        .where('active', true)
        .count('* as total')

      const availableTables = await Mesa.query()
        .where('empresa_id', user.empresaId)
        .where('status', 'available')
        .where('active', true)
        .count('* as total')

      // Produtos
      const totalProducts = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .count('* as total')

      const availableProducts = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('available', true)
        .count('* as total')

      // Fornecedores
      const activeSuppliers = await Fornecedor.query()
        .where('empresa_id', user.empresaId)
        .where('active', true)
        .count('* as total')

      // Estoque baixo (insumos com quantidade menor que o mínimo)
      const lowStockItems = await Insumo.query()
        .where('empresa_id', user.empresaId)
        .whereRaw('current_stock < minimum_stock')
        .count('* as total')

      // Vendas hoje
      const [todaySalesAmountRows, todaySalesCountRows] = await Promise.all([
        Venda.query()
          .where('empresa_id', user.empresaId)
          .where('sale_date', '>=', dayStartSql)
          .where('sale_date', '<', dayEndSql)
          .sum('total as total_sales'),
        Venda.query()
          .where('empresa_id', user.empresaId)
          .where('sale_date', '>=', dayStartSql)
          .where('sale_date', '<', dayEndSql)
          .count('* as total_transactions'),
      ])

      // Calcular ocupação de mesas
      const totalTablesCount = extractCount(totalTables)
      const activeTablesCount = extractCount(activeTables)
      const tableOccupancy =
        totalTablesCount > 0 ? Math.round((activeTablesCount / totalTablesCount) * 100) : 0

      const stats = {
        todayOrders: extractCount(todayOrders),
        pendingOrders: extractCount(pendingOrders),
        activeComandas: extractCount(activeComandas),
        activeTables: activeTablesCount,
        availableTables: extractCount(availableTables),
        totalProducts: extractCount(totalProducts),
        availableProducts: extractCount(availableProducts),
        activeSuppliers: extractCount(activeSuppliers),
        lowStockItems: extractCount(lowStockItems),
        tableOccupancy,
        todaySalesAmount: extractSum(todaySalesAmountRows, 'total_sales'),
        todaySalesCount: extractAgg(todaySalesCountRows, [
          'total_transactions',
          'count',
          'count(*)',
        ]),
      }

      const [unreadSupportRows, unreadSupportMessages] = await Promise.all([
        SuporteMensagem.query()
          .join('suporte_solicitacoes', 'suporte_solicitacoes.id', 'suporte_mensagens.ticket_id')
          .where('suporte_solicitacoes.opened_by_user_id', user.id)
          .whereIn('suporte_mensagens.sender_tipo', ['admin', 'sistema'])
          .whereNull('suporte_mensagens.lida_usuario_em')
          .count('* as total'),
        SuporteMensagem.query()
          .join('suporte_solicitacoes', 'suporte_solicitacoes.id', 'suporte_mensagens.ticket_id')
          .where('suporte_solicitacoes.opened_by_user_id', user.id)
          .whereIn('suporte_mensagens.sender_tipo', ['admin', 'sistema'])
          .whereNull('suporte_mensagens.lida_usuario_em')
          .select(
            'suporte_mensagens.id',
            'suporte_mensagens.mensagem',
            'suporte_mensagens.created_at',
            'suporte_solicitacoes.id as ticket_id',
            'suporte_solicitacoes.protocolo as ticket_protocolo'
          )
          .orderBy('suporte_mensagens.created_at', 'desc')
          .limit(5),
      ])

      logger.info(`[DASHBOARD] Stats: ${JSON.stringify(stats)}`)

      const html = await view.render('dashboard/index', {
        user,
        empresa: user.empresa,
        role: user.role,
        stats,
        unreadSupportCount: Number(unreadSupportRows[0]?.$extras?.total || 0),
        unreadSupportMessages,
      })
      return response.type('text/html').send(html)
    } catch (error) {
      logger.error(`[DASHBOARD] ERROR | Error: ${error.message}`)
      return response.status(500).send(`Erro ao carregar dashboard: ${error.message}`)
    }
  }

  /**
   * Retorna listagem de produtos com disponibilidade e quantidade máxima de preparo
   */
  async getProductAvailability({ auth, response, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Buscar todos os produtos ativos da empresa
      const produtos = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('active', true)
        .preload('ingredientes')
        .preload('cardapioCategoria')
        .orderBy('name', 'asc')

      // Enriquecer com informações de disponibilidade
      const productsWithAvailability = await Promise.all(
        produtos.map(async (produto) => {
          const maxQuantity = await insumoStockService.getMaxPossibleQuantity(produto.id)
          const availability = await insumoStockService.checkProductAvailability(produto.id, 1)

          return {
            id: produto.id,
            name: produto.name,
            category: produto.cardapioCategoria?.name || 'Sem categoria',
            maxPrepareQuantity: maxQuantity,
            isAvailable: maxQuantity > 0,
            hasInsufficientStock: !availability.available,
            missingInsumos: availability.missingInsumos.map((m) => ({
              name: m.name,
              available: m.available,
              needed: m.needed,
              shortage: m.needed - m.available,
            })),
          }
        })
      )

      logger.info(
        `[PRODUCT AVAILABILITY] Retrieved availability for ${productsWithAvailability.length} products`
      )

      return response.json({
        success: true,
        data: productsWithAvailability,
      })
    } catch (error) {
      logger.error(`[PRODUCT AVAILABILITY ERROR] ${error.message}`)
      return response.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  async debugCharts(ctx: HttpContext) {
    return this.getProductAvailability(ctx)
  }

  /**
   * Atualizar tema
   */
  async setTheme({ request, response, session, auth, logger }: HttpContext) {
    const selected = String(request.input('theme') || '').trim()

    // All valid themes (for backward compatibility)
    const validThemes = [
      'Cyberpunk',
      'Dark',
      'Fast',
      'Italiano',
      'Light',
      'Marítimo',
      'Medieval',
      'Retrowave',
      'Retrô',
    ]

    // Only themes available for user selection
    const displayThemes = ['Light', 'Dark']

    // Validate if theme exists in system
    if (!validThemes.includes(selected)) {
      logger.warn(`[DASHBOARD THEME] Tema inválido recebido: ${selected}`)
      session.flash('error', 'Tema inválido selecionado.')
      return response.redirect().back()
    }

    // Validate if user can select this theme (only display themes allowed)
    if (!displayThemes.includes(selected)) {
      logger.warn(`[DASHBOARD THEME] Tema não disponível para seleção: ${selected}`)
      session.flash('error', 'Tema não disponível para seleção.')
      return response.redirect().back()
    }

    // Salvar na sessão
    session.put('theme', selected)

    // Salvar no banco de dados
    const user = auth.getUserOrFail()
    user.theme = selected
    await user.save()

    logger.info(`[DASHBOARD THEME] Tema atualizado para: ${selected}`)
    session.flash('success', 'Tema atualizado com sucesso!')
    return response.redirect().back()
  }
}
