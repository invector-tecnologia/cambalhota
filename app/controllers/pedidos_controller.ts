import type { HttpContext } from '@adonisjs/core/http'
import Pedido from '#models/pedido'
import PedidoItem from '#models/pedido_item'
import Comanda from '#models/comanda'
import CardapioCategoria from '#models/cardapio_categoria'
import Funcionario from '#models/funcionario'
import vine from '@vinejs/vine'
import { extractCount, extractSum } from '#helpers/db_agg'
import insumoStockService from '#services/insumo_stock_service'
import cloudLogger from '#services/cloud_logger'
import PedidoService from '#services/pedido_service'
import { resolveUserTimezone } from '#helpers/timezone'
import { DateTime } from 'luxon'

export default class PedidosController {
  /**
   * Lista todos os pedidos
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', '')
    const type = request.input('type', '')
    const period = request.input('period', 'month') // Padrão: mês

    let query = Pedido.query()
      .where('empresa_id', user.empresaId)
      .preload('comanda')
      .preload('user')
      .preload('items')

    if (search) {
      query = query.where((builder) => {
        builder
          .where('orderNumber', 'ilike', `%${search}%`)
          .orWhere('customerName', 'ilike', `%${search}%`)
      })
    }

    if (status) {
      query = query.where('status', status)
    }

    if (type) {
      query = query.where('type', type)
    }

    // Filtro por período
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const now = DateTime.now().setZone(timezone)

    if (period === 'today') {
      const start = now.startOf('day').toISO()
      if (start) {
        query = query.where('created_at', '>=', start)
      }
    } else if (period === 'week') {
      const start = now.startOf('week').toISO()
      if (start) {
        query = query.where('created_at', '>=', start)
      }
    } else if (period === 'month') {
      const start = now.startOf('month').toISO()
      if (start) {
        query = query.where('created_at', '>=', start)
      }
    }

    const pedidos = await query.orderBy('createdAt', 'desc').paginate(page, 20)

    return view.render('pedidos/index', {
      pedidos: pedidos.serialize(),
      filters: { search, status, type, period },
    })
  }

  /**
   * Exibe formulário para criar novo pedido
   */
  async create({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const comandaId = request.input('comanda_id')

    // Buscar mesas disponíveis
    const comandas = await Comanda.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderByRaw('CAST(number AS INTEGER) ASC')

    // Buscar categorias e itens do cardápio
    const categories = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .preload('cardapioProdutos', (query) => {
        query.where('available', true)
      })
      .orderBy('sortOrder', 'asc')

    // Buscar funcionários atendentes da empresa
    const atendentes = await Funcionario.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .whereHas('funcoes', (query) => {
        query.where('name', 'Atendente')
      })
      .preload('funcoes')
      .orderBy('name', 'asc')

    // Enriquecer dados dos produtos com informações de disponibilidade de insumos
    const categoriesWithAvailability = await Promise.all(
      categories.map(async (category) => {
        const categoryData = category.serialize()
        categoryData.cardapioProdutos = await Promise.all(
          category.cardapioProdutos.map(async (produto) => {
            const produtoData = produto.serialize()
            const maxQuantity = await produto.getMaxPrepareQuantity()
            produtoData.maxPrepareQuantity = maxQuantity
            produtoData.isAvailable = maxQuantity > 0
            return produtoData
          })
        )
        return categoryData
      })
    )

    return view.render('pedidos/create', {
      tables: comandas.map((t) => t.serialize()),
      categories: categoriesWithAvailability,
      atendentes: atendentes.map((a) => a.serialize()),
      preSelectedTable: comandaId,
    })
  }

  /**
   * Armazena novo pedido
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    try {
      let rawData = request.all()

      // Parse items if it's a JSON string
      if (typeof rawData.items === 'string') {
        try {
          rawData.items = JSON.parse(rawData.items)
        } catch (e) {
          rawData.items = []
        }
      }

      // Log campos críticos antes da validação

      // Validar os dados já parseados
      const validator = vine.compile(
        vine.object({
          comandaId: vine.number().optional(),
          waiterId: vine.number().optional(),
          type: vine.enum(['dine_in', 'takeout', 'delivery']),
          customerName: vine.string().optional(),
          customerPhone: vine.string().optional(),
          deliveryAddress: vine.string().optional(),
          notes: vine.string().optional(),
          discount: vine.number().min(0).optional(),
          serviceCharge: vine.number().min(0).optional(),
          items: vine.array(
            vine.object({
              cardapioProductId: vine.number(),
              quantity: vine.number().min(1),
              specialInstructions: vine.string().optional(),
            })
          ),
        })
      )

      const data = await validator.validate(rawData)

      const pedido = await PedidoService.createPedido(data, user, logger, timezone)

      cloudLogger.info('PEDIDO_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        pedidoId: pedido.id,
        orderNumber: pedido.orderNumber,
        itemsCount: data.items.length,
      })

      session.flash('success', 'Pedido criado com sucesso!')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[STORE PEDIDO] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('PEDIDO_CREATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [STORE PEDIDO] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      const friendlyMessage =
        error?.message && String(error.message).includes('Insumos insuficientes')
          ? error.message
          : 'Erro ao criar pedido.'
      session.flash('error', friendlyMessage)
      return response.redirect().back()
    }
  }

  /**
   * Exibe um pedido específico
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('comanda')
      .preload('user')
      .preload('funcionario')
      .preload('items', (query) => {
        query.preload('cardapioProduto')
      })
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    // Garantir itens com status mais atual
    await pedido.load('items', (query) => {
      query.preload('cardapioProduto')
    })

    // Buscar funcionários atendentes da empresa
    const atendentes = await Funcionario.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .whereHas('funcoes', (query) => {
        query.where('name', 'Atendente')
      })
      .preload('funcoes')
      .orderBy('name', 'asc')

    return view.render('pedidos/show', {
      pedido: pedido.serialize(),
      atendentes: atendentes.map((a) => a.serialize()),
    })
  }

  /**
   * Exibe formulário para editar pedido
   */
  async edit({ view, params, response, auth, session }: HttpContext) {
    const user = await auth.authenticate()

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('comanda')
      .preload('items', (query) => {
        query.preload('cardapioProduto')
      })
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    // Bloquear edição de pedidos pagos
    if (pedido.status === 'paid') {
      session.flash('error', 'Pedidos pagos não podem ser editados.')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    }

    // Buscar mesas disponíveis
    const tables = await Comanda.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderByRaw('CAST(number AS INTEGER) ASC')

    // Buscar categorias e itens do cardápio
    const categories = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .preload('cardapioProdutos', (query) => {
        query.where('available', true)
      })
      .orderBy('sortOrder', 'asc')

    // Buscar funcionários atendentes da empresa
    const atendentes = await Funcionario.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .whereHas('funcoes', (query) => {
        query.where('name', 'Atendente')
      })
      .preload('funcoes')
      .orderBy('name', 'asc')

    return view.render('pedidos/edit', {
      pedido,
      tables,
      categories,
      atendentes,
    })
  }

  /**
   * Atualiza pedido
   */
  async update({ request, response, params, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    logger.info(`[PEDIDOS UPDATE] User ${user.id} updating pedido ${params.id}`)

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    // Bloquear atualização de pedidos pagos
    if (pedido.status === 'paid') {
      session.flash('error', 'Pedidos pagos não podem ser editados.')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    }

    try {
      // const rawData = request.all()

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            comandaId: vine
              .string()
              .optional()
              .transform((value) => (value === '' || value === undefined ? null : Number(value))),
            customerName: vine.string().optional(),
            customerPhone: vine.string().optional(),
            deliveryAddress: vine.string().optional(),
            notes: vine.string().optional(),
            discount: vine.number().min(0).optional(),
            serviceCharge: vine.number().min(0).optional(),
            items: vine.string().optional(),
          })
        )
      )

      await PedidoService.updatePedido(
        pedido,
        {
          comandaId: data.comandaId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
          discount: data.discount,
          serviceCharge: data.serviceCharge,
          itemsJson: data.items,
        },
        logger
      )

      cloudLogger.info('PEDIDO_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        pedidoId: pedido.id,
        orderNumber: pedido.orderNumber,
      })

      session.flash('success', 'Pedido atualizado com sucesso!')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[UPDATE PEDIDO] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('PEDIDO_UPDATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [UPDATE PEDIDO] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao atualizar pedido.')
      return response.redirect().back()
    }
  }

  /**
   * Confirma pedido
   */
  async confirm({ params, response, session, auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    try {
      await pedido.confirm(timezone)
      session.flash('success', 'Pedido confirmado!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao confirmar pedido.')
      return response.redirect().back()
    }
  }

  /**
   * Cancela pedido
   * IMPORTANTE: Só permite cancelamento antes do preparo (pending/confirmed)
   * Após iniciar preparo, insumos já foram debitados e não podem ser revertidos automaticamente
   */
  async cancel({ params, response, session, auth, logger, request }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    if (!pedido.canCancel) {
      session.flash(
        'error',
        'Pedido não pode ser cancelado no status atual. Após iniciar o preparo, os insumos já foram consumidos.'
      )
      return response.redirect().back()
    }

    try {
      // Liberar reservas de insumos
      await insumoStockService.releaseInsumoReservation(pedido)
      logger.info(`[INSUMO RESERVATION RELEASE] Reservas liberadas para pedido ${pedido.id}`)

      await pedido.cancel(timezone)
      session.flash('success', 'Pedido cancelado!')
      return response.redirect().back()
    } catch (error) {
      logger.error(`[CANCEL PEDIDO ERROR] ${error.message}`)
      session.flash('error', 'Erro ao cancelar pedido.')
      return response.redirect().back()
    }
  }

  /**
   * Atualiza status do pedido
   */
  async updateStatus({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    const { status } = request.only(['status'])

    try {
      // Carregar itens para sincronizar status de item/pedido
      await pedido.load('items')
      const activeItems = pedido.items.filter((item) => item.status !== 'cancelled')

      switch (status) {
        case 'preparing':
          await Promise.all(activeItems.map((item) => item.startPreparing(timezone)))
          await pedido.startPreparing()

          // Descontar insumos do almoxarifado quando o pedido ENTRA em preparo
          try {
            await insumoStockService.deductInsumoFromOrder(pedido)
            logger.info(
              `[INSUMO DEDUCTION] Insumos descontados com sucesso para pedido ${pedido.id} via updateStatus`
            )
          } catch (error) {
            logger.error(
              `[INSUMO DEDUCTION ERROR] Erro ao descontar insumos do pedido ${pedido.id}: ${error.message}`
            )
            // Não interromper o fluxo, apenas registrar o erro
            session.flash('warning', `Aviso: ${error.message}`)
          }
          break
        case 'ready':
          await Promise.all(activeItems.map((item) => item.markReady(timezone)))
          await pedido.markReady(timezone)
          break
        case 'served':
          await Promise.all(activeItems.map((item) => item.serve(timezone)))
          await pedido.serve(timezone)
          break
        case 'paid':
          await pedido.pay(timezone)
          break
        default:
          session.flash('error', 'Status inválido.')
          return response.redirect().back()
      }

      session.flash('success', `Status atualizado para: ${pedido.statusBadge.text}`)
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao atualizar status.')
      return response.redirect().back()
    }
  }

  /**
   * Adiciona item ao pedido
   */
  async addItem({ params, request, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido || !pedido.canEdit) {
      return response.notFound('Pedido não encontrado ou não pode ser editado')
    }

    const data = await request.validateUsing(
      vine.compile(
        vine.object({
          cardapioProductId: vine.number(),
          quantity: vine.number().min(1),
          specialInstructions: vine.string().optional(),
        })
      )
    )

    try {
      await pedido.addItem(data.cardapioProductId, data.quantity, data.specialInstructions)
      session.flash('success', 'Item adicionado ao pedido!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao adicionar item.')
      return response.redirect().back()
    }
  }

  /**
   * Remove item do pedido
   */
  async removeItem({ params, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()

    const orderItem = await PedidoItem.query().where('id', params.itemId).preload('pedido').first()

    if (!orderItem || orderItem.pedido.empresaId !== user.empresaId) {
      return response.notFound('Item não encontrado')
    }

    if (!orderItem.canEdit) {
      session.flash('error', 'Item não pode ser removido no status atual.')
      return response.redirect().back()
    }

    try {
      const pedido = orderItem.pedido
      await pedido.removeItem(orderItem.id)
      session.flash('success', 'Item removido do pedido!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao remover item.')
      return response.redirect().back()
    }
  }

  /**
   * Kitchen dashboard - visualização da cozinha
   */
  async kitchen({ view, auth, request }: HttpContext) {
    const user = await auth.authenticate()

    // Calcular limite de 30 minutos atrás
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const thirtyMinutesAgo = DateTime.now().setZone(timezone).minus({ minutes: 30 }).toJSDate()

    // Buscar todos os itens em preparação (pending e preparing) - apenas os que requerem preparo
    const preparingItems = await PedidoItem.query()
      .whereHas('pedido', (orderQuery) => {
        orderQuery.where('empresa_id', user.empresaId)
      })
      .whereIn('status', ['pending', 'preparing'])
      .whereHas('cardapioProduto', (productQuery) => {
        productQuery.where('requires_preparation', true)
      })
      .preload('pedido', (orderQuery) => {
        orderQuery.preload('comanda')
      })
      .preload('cardapioProduto')
      .orderBy('createdAt', 'asc')

    // Buscar itens prontos (apenas dos últimos 30 minutos) - apenas os que requerem preparo
    const readyItems = await PedidoItem.query()
      .whereHas('pedido', (orderQuery) => {
        orderQuery.where('empresa_id', user.empresaId)
      })
      .where('status', 'ready')
      .where('preparedAt', '>=', thirtyMinutesAgo)
      .whereHas('cardapioProduto', (productQuery) => {
        productQuery.where('requires_preparation', true)
      })
      .preload('pedido', (orderQuery) => {
        orderQuery.preload('comanda')
      })
      .preload('cardapioProduto')
      .orderBy('preparedAt', 'asc')

    // Buscar itens servidos (apenas dos últimos 30 minutos) - apenas os que requerem preparo
    const servedItems = await PedidoItem.query()
      .whereHas('pedido', (orderQuery) => {
        orderQuery.where('empresa_id', user.empresaId)
      })
      .where('status', 'served')
      .where('updatedAt', '>=', thirtyMinutesAgo)
      .whereHas('cardapioProduto', (productQuery) => {
        productQuery.where('requires_preparation', true)
      })
      .preload('pedido', (orderQuery) => {
        orderQuery.preload('comanda')
      })
      .preload('cardapioProduto')
      .orderBy('updatedAt', 'asc')

    // Buscar itens cancelados (apenas dos últimos 30 minutos) - apenas os que requerem preparo
    const cancelledItems = await PedidoItem.query()
      .whereHas('pedido', (orderQuery) => {
        orderQuery.where('empresa_id', user.empresaId)
      })
      .where('status', 'cancelled')
      .where('updatedAt', '>=', thirtyMinutesAgo)
      .whereHas('cardapioProduto', (productQuery) => {
        productQuery.where('requires_preparation', true)
      })
      .preload('pedido', (orderQuery) => {
        orderQuery.preload('comanda')
      })
      .preload('cardapioProduto')
      .orderBy('updatedAt', 'asc')

    return view.render('pedidos/kitchen', {
      preparingItems: preparingItems.map((i) => i.serialize()),
      readyItems: readyItems.map((i) => i.serialize()),
      servedItems: servedItems.map((i) => i.serialize()),
      cancelledItems: cancelledItems.map((i) => i.serialize()),
    })
  }

  /**
   * API: Stats do dashboard
   */
  async stats({ response, auth, request }: HttpContext) {
    const user = await auth.authenticate()

    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const today = DateTime.now().setZone(timezone).startOf('day').toJSDate()

    const [totalOrders, pendingOrders, revenue] = await Promise.all([
      Pedido.query()
        .where('empresa_id', user.empresaId)
        .where('createdAt', '>=', today.toISOString())
        .count('* as total'),
      Pedido.query()
        .where('empresa_id', user.empresaId)
        .whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .count('* as total'),
      Pedido.query()
        .where('empresa_id', user.empresaId)
        .where('createdAt', '>=', today.toISOString())
        .whereIn('status', ['served', 'paid'])
        .sum('total as revenue'),
    ])

    return response.json({
      totalOrdersToday: extractCount(totalOrders),
      pendingOrders: extractCount(pendingOrders),
      revenueToday: extractSum(revenue, 'revenue'),
    })
  }

  /**
   * Atualiza o status de um item individual do pedido
   */
  async updateItemStatus({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    logger.info(`[PEDIDO ITEM UPDATE STATUS] Pedido ID: ${params.id} | Item ID: ${params.itemId}`)

    // Buscar o item e garantir que pertence à empresa do usuário
    const item = await PedidoItem.query()
      .where('id', params.itemId)
      .whereHas('pedido', (query) => {
        query.where('empresa_id', user.empresaId).where('id', params.id)
      })
      .preload('pedido')
      .first()

    if (!item) {
      session.flash('error', 'Item não encontrado')
      return response.redirect().back()
    }

    // Impedir alterações em itens de pedidos pagos ou já cancelados
    if (['paid', 'cancelled'].includes(item.pedido.status)) {
      session.flash('error', 'Itens de pedidos pagos ou cancelados não podem ser alterados.')
      return response.redirect().back()
    }

    const { status } = request.only(['status'])

    logger.info(`[PEDIDO ITEM UPDATE STATUS] Changing status to: ${status}`)

    try {
      switch (status) {
        case 'pending':
          await item.markPending()
          session.flash('success', 'Item marcado como pendente')
          break
        case 'preparing':
          await item.startPreparing(timezone)
          session.flash('success', 'Item marcado como em preparo')
          break
        case 'ready':
          await item.markReady(timezone)
          session.flash('success', 'Item marcado como pronto')
          break
        case 'cancelled':
          await item.cancel(timezone)
          session.flash('success', 'Item cancelado')
          break
        case 'served':
          await item.serve(timezone)
          session.flash('success', 'Item marcado como servido')
          break
        default:
          session.flash('error', 'Status inválido')
          return response.redirect().back()
      }

      // Atualizar o status do pedido baseado no status dos itens
      const pedido = item.pedido
      await pedido.load('items')

      // Verificar se todos os itens estão no mesmo status para atualizar o pedido
      const allPending = pedido.items.every((i) => i.status === 'pending')
      const allReady = pedido.items.every((i) => i.status === 'ready')
      const anyPreparing = pedido.items.some((i) => i.status === 'preparing')
      const anyReady = pedido.items.some((i) => i.status === 'ready')
      const wasNotPreparing = pedido.status !== 'preparing' && pedido.status !== 'ready'

      // Atualizar status do pedido
      if (anyReady || anyPreparing) {
        // NOVO: Descontar insumos quando PRIMEIRA VEZ que algum item entra em preparo
        // (não quando fica pronto, que é o status final da preparação)
        if (wasNotPreparing) {
          pedido.status = 'preparing'
          await pedido.save()
          logger.info(`[PEDIDO STATUS] Pedido ${pedido.id} atualizado para 'preparing'`)

          // Descontar insumos do almoxarifado quando o pedido ENTRA em preparo
          try {
            await insumoStockService.deductInsumoFromOrder(pedido)
            logger.info(
              `[INSUMO DEDUCTION] Insumos descontados com sucesso para pedido ${pedido.id}`
            )
          } catch (error) {
            logger.error(
              `[INSUMO DEDUCTION ERROR] Erro ao descontar insumos do pedido ${pedido.id}: ${error.message}`
            )
            // Não interromper o fluxo, apenas registrar o erro
            session.flash('warning', `Aviso: ${error.message}`)
          }
        } else {
          // Já estava em preparo, apenas atualizar para ready se necessário
          if (allReady) {
            pedido.status = 'ready'
            await pedido.save()
            logger.info(`[PEDIDO STATUS] Pedido ${pedido.id} atualizado para 'ready'`)
          }
        }
      } else if (allPending) {
        pedido.status = 'confirmed'
        await pedido.save()
        logger.info(`[PEDIDO STATUS] Pedido ${pedido.id} atualizado para 'confirmed'`)
      }

      logger.info(`[PEDIDO ITEM UPDATE STATUS] Item ${params.itemId} status updated to ${status}`)

      // Se for uma requisição PATCH (JSON), retornar JSON
      if (request.method() === 'PATCH') {
        return response.json({ success: true, message: 'Status atualizado com sucesso' })
      }

      return response.redirect().back()
    } catch (error) {
      logger.error(`[PEDIDO ITEM UPDATE STATUS ERROR] ${error.message}`)

      // Se for uma requisição PATCH (JSON), retornar erro JSON
      if (request.method() === 'PATCH') {
        return response.status(500).json({ success: false, message: 'Erro ao atualizar status' })
      }

      session.flash('error', 'Erro ao atualizar status do item')
      return response.redirect().back()
    }
  }

  /**
   * Imprimir pedido para cozinha (apenas itens que requerem preparo)
   */
  async printKitchen({ params, request, view, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    const pedido = await Pedido.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .firstOrFail()

    // Obter itens selecionados da query string (opcional)
    const selectedItemsParam = request.input('items')
    const selectedItemIds = selectedItemsParam
      ? (Array.isArray(selectedItemsParam)
          ? selectedItemsParam.map((id) => Number(id))
          : selectedItemsParam.split(',').map((id: string) => Number(id))
        ).filter((id: number) => !Number.isNaN(id))
      : null

    // Buscar itens do pedido
    let itemsQuery = PedidoItem.query().where('pedido_id', pedido.id).preload('cardapioProduto')

    // Se houver itens selecionados, filtrar por eles
    if (selectedItemIds && selectedItemIds.length > 0) {
      itemsQuery = itemsQuery.whereIn('id', selectedItemIds)
    } else {
      // Caso contrário, buscar apenas os que requerem preparo
      itemsQuery = itemsQuery.whereHas('cardapioProduto', (productQuery) => {
        productQuery.where('requires_preparation', true)
      })
    }

    const items = await itemsQuery

    logger.info(
      `[PEDIDO PRINT KITCHEN] User: ${user.id}, Pedido: ${pedido.id}, Selected items: ${selectedItemIds?.join(',') || 'all'}`
    )

    return view.render('pedidos/print-kitchen', {
      pedido: pedido.serialize(),
      itens: items.map((i) => i.serialize()),
    })
  }

  /**
   * Deletar pedido
   */
  async destroy({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    logger.info(`[PEDIDOS DESTROY] User ${user.id} deleting pedido ${params.id}`)

    const pedido = await Pedido.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!pedido) {
      return response.notFound('Pedido não encontrado')
    }

    // Bloquear deleção de pedidos pagos
    if (pedido.status === 'paid') {
      session.flash('error', 'Pedidos pagos não podem ser deletados.')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    }

    try {
      // Deletar itens do pedido
      await PedidoItem.query().where('pedido_id', pedido.id).delete()

      // Deletar o pedido
      const pedidoId = pedido.id
      const orderNumber = pedido.orderNumber
      await pedido.delete()

      cloudLogger.info('PEDIDO_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        pedidoId: pedidoId,
        orderNumber: orderNumber,
      })

      session.flash('success', `Pedido #${orderNumber} foi deletado com sucesso.`)
      logger.info(`[PEDIDOS DESTROY SUCCESS] Pedido ${pedidoId} deleted by user ${user.id}`)

      return response.redirect().toRoute('pedidos.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(`[PEDIDOS DESTROY ERROR] ${error.message}`)
      cloudLogger.error('PEDIDO_DELETE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao deletar pedido. Tente novamente.')
      return response.redirect().toRoute('pedidos.show', [pedido.id])
    }
  }
}
