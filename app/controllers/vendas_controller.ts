import type { HttpContext } from '@adonisjs/core/http'
import Venda from '#models/venda'
import VendaItem from '#models/venda_item'
import Pedido from '#models/pedido'
import CardapioProduto from '#models/cardapio_produto'
import Empresa from '#models/empresa'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { resolveUserTimezone } from '#helpers/timezone'
import cloudLogger from '#services/cloud_logger'

export default class VendasController {
  /**
   * Lista todas as vendas
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const paymentMethod = request.input('payment_method', '')
    const dateFrom = request.input('date_from', '')
    const dateTo = request.input('date_to', '')

    let query = Venda.query()
      .where('empresa_id', user.empresaId)
      .preload('user')
      .preload('comanda', (queryComanda) => {
        queryComanda.where('empresa_id', user.empresaId).preload('pedidos', (queryPedido) => {
          queryPedido
            .where('empresa_id', user.empresaId)
            .orderBy('created_at', 'desc')
            .preload('items')
            .preload('user')
            .preload('funcionario')
        })
      })

    if (search) {
      query = query.where((builder) => {
        builder.where('sale_number', 'ilike', `%${search}%`).orWhereHas('user', (userQuery) => {
          userQuery.where('name', 'ilike', `%${search}%`)
        })
      })
    }

    if (paymentMethod) {
      query = query.where('payment_method', paymentMethod)
    }

    if (dateFrom) {
      query = query.where('sale_date', '>=', dateFrom)
    }

    if (dateTo) {
      query = query.where('sale_date', '<=', dateTo)
    }

    const vendas = await query.orderBy('sale_date', 'desc').paginate(page, 20)

    return view.render('vendas/index', {
      vendas: vendas.serialize(),
      filters: { search, paymentMethod, dateFrom, dateTo },
    })
  }

  /**
   * Exibe formulário para nova venda
   */
  async create({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const orderId = request.input('pedido_id')

    let order = null
    if (orderId) {
      order = await Pedido.query()
        .where('id', orderId)
        .where('empresa_id', user.empresaId)
        .where('status', 'served')
        .preload('items', (query) => {
          query.preload('cardapioProduto')
        })
        .preload('comanda')
        .first()
    }

    const menuItems = await CardapioProduto.query()
      .where('empresa_id', user.empresaId)
      .where('available', true)
      .preload('cardapioCategoria')
      .orderBy('name')

    return view.render('vendas/create', {
      order: order?.serialize(),
      menuItems: menuItems.map((m) => m.serialize()),
    })
  }

  /**
   * Armazena nova venda
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    try {
      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            pedidoId: vine.number().optional(),
            paymentMethod: vine.enum(['cash', 'card', 'pix', 'split']),
            discount: vine.number().min(0).optional(),
            notes: vine.string().optional(),
            emitNf: vine.string().optional(),
            cpf: vine.string().trim().optional(),
            items: vine
              .array(
                vine.object({
                  cardapioProductId: vine.number(),
                  quantity: vine.number().min(1),
                  unitPrice: vine.number().min(0),
                })
              )
              .optional(),
          })
        )
      )

      let venda: Venda

      if (data.pedidoId) {
        const pedido = await Pedido.query()
          .where('id', data.pedidoId)
          .where('empresa_id', user.empresaId)
          .where('status', 'served')
          .first()

        if (!pedido) {
          session.flash('error', 'Pedido não encontrado ou não está pronto para venda.')
          return response.redirect().back()
        }

        venda = await Venda.createFromPedido(
          pedido,
          data.paymentMethod,
          data.discount || 0,
          timezone
        )

        pedido.status = 'paid'
        await pedido.save()
      } else {
        const saleNumber = await Venda.generateSaleNumber(user.empresaId, timezone)

        venda = await Venda.create({
          empresaId: user.empresaId,
          userId: user.id,
          saleNumber,
          paymentMethod: data.paymentMethod,
          discount: data.discount || 0,
          notes: data.notes,
          saleDate: DateTime.now().setZone(timezone),
        })

        if (data.items) {
          for (const itemData of data.items) {
            const menuItem = await CardapioProduto.find(itemData.cardapioProductId)
            if (menuItem) {
              await VendaItem.create({
                vendaId: venda.id,
                cardapioProdutoId: itemData.cardapioProductId,
                itemName: menuItem.name,
                unitPrice: itemData.unitPrice,
                unitCost: menuItem.salePrice,
                quantity: itemData.quantity,
              })
            }
          }
        }

        await venda.calculateTotals()
        await venda.save()
      }

      const emitNf = String(data.emitNf) === 'true' || String(data.emitNf) === 'on'
      if (emitNf) {
        try {
          logger.info(`[STORE VENDA] Iniciando emissão de NF-e para venda ${venda.id}`)

          const fiscalServiceModule = await import('#services/fiscal_service')
          const FiscalService = fiscalServiceModule.default
          const cleanCpf = (data.cpf || '').replace(/\D/g, '') || undefined
          const result = await FiscalService.emitNFCeFromVenda({
            empresaId: user.empresaId,
            vendaId: venda.id,
            customerCpf: cleanCpf,
          })

          if (result.success) {
            logger.info(`[STORE VENDA] NF-e emitida com sucesso: ${result.nfce?.accessKey}`)
            session.flash(
              'success',
              `Venda registrada e NF-e emitida com sucesso! Chave: ${result.nfce?.accessKey}`
            )
          } else {
            logger.error(`[STORE VENDA] Erro ao emitir NF-e: ${result.error}`)
            session.flash(
              'warning',
              `Venda registrada, mas houve erro na emissão da NF-e: ${result.error}`
            )
          }
        } catch (nfError) {
          logger.error(`[STORE VENDA] Exceção ao emitir NF-e: ${nfError}`)
          session.flash('warning', 'Venda registrada, mas houve erro ao emitir a nota fiscal.')
        }
      } else {
        session.flash('success', 'Venda registrada com sucesso!')
      }

      cloudLogger.info('VENDA_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        vendaId: venda.id,
        saleNumber: venda.saleNumber,
        totalAmount: venda.total,
        paymentMethod: venda.paymentMethod,
      })

      return response.redirect().toRoute('vendas.show', [venda.id])
    } catch (error: any) {
      const authenticatedUser = await auth.authenticate()
      await authenticatedUser.load('empresa')
      logger.error(
        `[STORE VENDA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('VENDA_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao registrar venda.')
      return response.redirect().back()
    }
  }

  /**
   * Exibe uma venda específica
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const venda = await Venda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('user')
      .preload('items')
      .preload('comanda', (queryComanda) => {
        queryComanda.where('empresa_id', user.empresaId).preload('pedidos', (queryPedido) => {
          queryPedido
            .where('empresa_id', user.empresaId)
            .orderBy('created_at', 'desc')
            .preload('items')
            .preload('user')
            .preload('funcionario')
        })
      })
      .first()

    if (!venda) {
      return response.notFound('Venda não encontrada')
    }

    const itemsWithProfit = venda.items.map((item) => {
      const itemProfit =
        Number(item.subtotal || 0) - Number(item.unitCost || 0) * Number(item.quantity || 0)
      return {
        ...item.serialize(),
        itemProfit,
      }
    })

    const subtotalProfit = Number(venda.subtotal || 0) - Number(venda.costTotal || 0)

    const fiscalNoteModule = await import('#models/fiscal_note')
    const FiscalNote = fiscalNoteModule.default
    const fiscalNote = await FiscalNote.query()
      .where('venda_id', venda.id)
      .orderBy('created_at', 'desc')
      .first()

    return view.render('vendas/show', {
      venda: venda.serialize(),
      itemsWithProfit,
      subtotalProfit,
      fiscalNote: fiscalNote ? fiscalNote.serialize() : null,
      csrfToken: (view as any).getCsrfToken?.(),
    })
  }

  /**
   * Imprimir nota fiscal da venda
   */
  async print({ view, params, response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    logger.info(`[VENDAS PRINT] User ${user.id} printing venda ${params.id}`)

    const venda = await Venda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('user')
      .preload('items', (queryItems) => {
        queryItems.orderBy('id', 'asc')
      })
      .preload('comanda', (queryComanda) => {
        queryComanda.preload('mesa')
      })
      .first()

    if (!venda) {
      return response.notFound('Venda não encontrada')
    }

    const empresa = await Empresa.findOrFail(user.empresaId)

    const vendaSerialized = venda.serialize()
    const empresaSerialized = {
      ...empresa.serialize(),
      formattedCnpj: empresa.formattedCnpj,
      formattedDocument: empresa.formattedDocument,
      fullAddress: empresa.fullAddress,
    }

    return view.render('vendas/print', {
      venda: vendaSerialized,
      empresa: empresaSerialized,
    })
  }
}
