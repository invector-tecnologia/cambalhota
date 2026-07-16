import type { HttpContext } from '@adonisjs/core/http'
import Comanda from '#models/comanda'
import Mesa from '#models/mesa'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { resolveUserTimezone } from '#helpers/timezone'
import ComandaCloseService from '#services/comanda_close_service'
import cloudLogger from '#services/cloud_logger'

export default class ComandasController {
  /**
   * Lista todas as comandas
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const mesaId = request.input('mesa_id', '')
    const inactiveFrom = request.input('inactive_from', '')

    let query = Comanda.query().where('empresa_id', user.empresaId).preload('mesa')

    if (search) {
      query = query.where((builder) => {
        builder.where('number', 'ilike', `%${search}%`).orWhere('name', 'ilike', `%${search}%`)
      })
    }

    if (mesaId) {
      query = query.where('mesa_id', mesaId)
    }

    // Filtro de data para comandas inativas
    // Se não houver filtro de data, mostrar apenas as inativadas nas últimas 12h
    // Se houver filtro, usar a data fornecida
    let inactiveFilterDate: DateTime | null = null
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    if (inactiveFrom) {
      inactiveFilterDate = DateTime.fromISO(inactiveFrom, { zone: timezone })
    } else {
      // Padrão: últimas 12 horas
      inactiveFilterDate = DateTime.now().setZone(timezone).minus({ hours: 12 })
    }

    const comandas = await query.orderByRaw('CAST(number AS INTEGER) ASC').paginate(page, 20)

    // Separar comandas ativas de inativas
    const activeComandasList = comandas.all().filter((c) => c.active)
    const allInactiveComandasList = comandas.all().filter((c) => !c.active)

    // Filtrar inativas por data
    const inactiveComandasList = allInactiveComandasList.filter((c) => {
      return c.updatedAt >= inactiveFilterDate!
    })

    // Buscar mesas para filtro
    const mesas = await Mesa.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('number', 'asc')

    return view.render('comandas/index', {
      comandas: {
        ...comandas.serialize(),
        data: comandas.all(),
      },
      activeComandasList: activeComandasList || [],
      inactiveComandasList: inactiveComandasList || [],
      mesas: mesas.map((m) => m.serialize()),
      filters: { search, mesaId, inactiveFrom },
    })
  }

  /**
   * Exibe formulário para criar nova comanda
   */
  async create({ view, auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const mesaIdParam = request.input('mesa_id')

    const mesas = await Mesa.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('number', 'asc')

    return view.render('comandas/create', {
      mesas: mesas.map((m) => m.serialize()),
      selectedMesaId: mesaIdParam ? Number.parseInt(mesaIdParam) : null,
    })
  }

  /**
   * Armazena nova comanda
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    try {
      // const rawData = request.all()

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            name: vine.string().optional(),
            notes: vine.string().optional(),
            active: vine.string().optional(),
            mesaId: vine.number().optional(),
          })
        )
      )

      // Gerar número automático para a comanda
      const lastComanda = await Comanda.query()
        .where('empresa_id', user.empresaId)
        .orderBy('number', 'desc')
        .first()

      let nextNumber = '0001'
      if (lastComanda) {
        const lastNumberInt = Number.parseInt(lastComanda.number.replace(/\D/g, '')) || 0
        nextNumber = String(lastNumberInt + 1).padStart(4, '0')
      }

      logger.info(
        `[COMANDAS STORE] User ${user.id} | Generated number: ${nextNumber} | Mesa: ${data.mesaId || 'none'} | Name: ${data.name || 'none'}`
      )

      const comanda = await Comanda.create({
        empresaId: user.empresaId,
        mesaId: data.mesaId || null,
        number: nextNumber,
        name: data.name,
        notes: data.notes,
        active: Boolean(data.active),
      })

      logger.info(
        `[COMANDAS STORE] SUCCESS | Comanda ID: ${comanda.id} | Number: ${comanda.number} | User: ${user.id}`
      )
      cloudLogger.info('COMANDA_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        comandaId: comanda.id,
        comandaNumber: comanda.number,
      })

      session.flash('success', 'Comanda criada com sucesso!')
      return response.redirect().toRoute('comandas.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[STORE COMANDA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('COMANDA_CREATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [STORE COMANDA] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao criar comanda.')
      return response.redirect().back()
    }
  }

  /**
   * Exibe uma comanda específica
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('mesa')
      .preload('pedidos', (query) => {
        query.orderBy('created_at', 'desc').preload('items').preload('user').preload('funcionario')
      })
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    // Separar pedidos em ativos e pagos
    const activePedidos = comanda.pedidos.filter((pedido) =>
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(pedido.status)
    )
    const paidPedidos = comanda.pedidos.filter((pedido) => pedido.status === 'paid')

    return view.render('comandas/show', {
      comanda,
      activePedidos,
      paidPedidos,
    })
  }

  /**
   * Exibe formulário para editar comanda
   */
  async edit({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('mesa')
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    const mesas = await Mesa.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('number', 'asc')

    return view.render('comandas/edit', {
      comanda,
      mesas: mesas.map((m) => m.serialize()),
    })
  }

  /**
   * Atualiza comanda
   */
  async update({ request, response, params, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    logger.info(`[COMANDAS UPDATE] User ${user.id} updating comanda ${params.id}`)

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    const data = await request.validateUsing(
      vine.compile(
        vine.object({
          name: vine.string().optional(),
          notes: vine.string().optional(),
          active: vine.accepted().optional(),
          mesaId: vine.number().optional(),
        })
      )
    )

    try {
      comanda.merge({
        mesaId: data.mesaId || null,
        name: data.name,
        notes: data.notes,
        active: !!data.active,
      })

      await comanda.save()

      logger.info(`[COMANDAS UPDATE] SUCCESS | Comanda ${comanda.id} updated by user ${user.id}`)
      cloudLogger.info('COMANDA_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        comandaId: comanda.id,
        comandaNumber: comanda.number,
      })

      session.flash('success', 'Comanda atualizada com sucesso!')
      return response.redirect().toRoute('comandas.show', [comanda.id])
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      cloudLogger.error('COMANDA_UPDATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao atualizar comanda.')
      return response.redirect().back()
    }
  }

  /**
   * Remove comanda
   */
  async destroy({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    logger.info(`[COMANDAS DESTROY] User ${user.id} attempting to delete comanda ${params.id}`)

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    try {
      // Verificar se há pedidos ativos para esta comanda
      const activePedidos = await comanda.getActivePedidos()
      if (activePedidos.length > 0) {
        session.flash('error', 'Não é possível excluir comanda com pedidos ativos.')
        return response.redirect().back()
      }

      const comandaId = comanda.id
      const comandaNumber = comanda.number
      await comanda.delete()

      logger.info(`[COMANDAS DESTROY] SUCCESS | Comanda ${comandaId} deleted by user ${user.id}`)
      cloudLogger.info('COMANDA_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        comandaId: comandaId,
        comandaNumber: comandaNumber,
      })

      session.flash('success', 'Comanda excluída com sucesso!')
      return response.redirect().toRoute('comandas.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[COMANDAS DESTROY] ERROR | Comanda ${params.id} | User ${errorUser.id} | Error: ${error.message}`
      )
      cloudLogger.error('COMANDA_DELETE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao excluir comanda.')
      return response.redirect().back()
    }
  }

  /**
   * Fecha a comanda e gera uma venda.
   */
  async closeAndPay({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    logger.info(`[COMANDAS CLOSE_AND_PAY] User ${user.id} attempting to close comanda ${params.id}`)

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('pedidos', (pedidoQuery) => {
        pedidoQuery.preload('items', (itemQuery) => {
          itemQuery.preload('cardapioProduto')
        })
      })
      .first()

    if (!comanda) {
      session.flash('error', 'Comanda não encontrada.')
      return response.status(404).redirect().back()
    }

    if (!comanda.active) {
      session.flash('error', 'Esta comanda já está fechada.')
      return response.status(400).redirect().back()
    }

    const { paymentMethod, discount, cpf, emitNfce } = await request.validateUsing(
      vine.compile(
        vine.object({
          paymentMethod: vine.enum(['cash', 'card', 'pix', 'split']),
          discount: vine.number().min(0).max(100).optional(),
          cpf: vine.string().trim().optional(),
          emitNfce: vine.string().optional(),
        })
      )
    )

    // Garantir que o desconto tem um valor padrão
    const discountPercentage = discount || 0

    // Log detalhado do desconto recebido
    logger.info(
      `[COMANDAS CLOSE_AND_PAY] Desconto recebido | Raw: ${request.input('discount')} | Parsed: ${discountPercentage} | Type: ${typeof discountPercentage}`
    )

    try {
      const shouldEmitNfce = emitNfce === 'true'
      const result = await ComandaCloseService.closeAndPay({
        comanda,
        user,
        paymentMethod,
        discountPercentage,
        cpf,
        emitNfce: shouldEmitNfce,
        timezone,
        logger,
      })

      if (shouldEmitNfce) {
        session.flash(
          'success',
          `Venda #${result.venda.saleNumber} registrada. A NF-e está sendo processada.`
        )
      } else {
        session.flash(
          'success',
          `Comanda fechada e venda #${result.venda.saleNumber} gerada com sucesso!`
        )
      }

      logger.info(
        `[COMANDAS CLOSE_AND_PAY] SUCCESS | Comanda ${comanda.id} closed and Venda ${result.venda.id} created by user ${user.id}`
      )
      return response.redirect().toRoute('vendas.show', { id: result.venda.id })
    } catch (error) {
      logger.error(
        `[COMANDAS CLOSE_AND_PAY] ERROR | Comanda ${params.id} | User ${user.id} | Error: ${error.message}`
      )
      session.flash('error', 'Ocorreu um erro ao fechar a comanda e gerar a venda.')
      return response.redirect().back()
    }
  }

  /**
   * Alterna o status ativo/inativo da comanda
   */
  async toggleActive({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    logger.info(
      `[COMANDAS TOGGLE_ACTIVE] User ${user.id} toggling active status for comanda ${params.id}`
    )

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    try {
      comanda.active = !comanda.active
      await comanda.save()

      const status = comanda.active ? 'ativada' : 'inativada'
      logger.info(
        `[COMANDAS TOGGLE_ACTIVE] SUCCESS | Comanda ${comanda.id} ${status} by user ${user.id}`
      )
      session.flash('success', `Comanda ${status} com sucesso!`)
      return response.redirect().back()
    } catch (error) {
      logger.error(
        `[COMANDAS TOGGLE_ACTIVE] ERROR | Comanda ${params.id} | User ${user.id} | Error: ${error.message}`
      )
      session.flash('error', 'Erro ao alterar status da comanda.')
      return response.redirect().back()
    }
  }

  /**
   * Imprimir nota de consumo da comanda
   */
  async print({ view, params, response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    logger.info(`[COMANDAS PRINT] User ${user.id} printing comanda ${params.id}`)

    const comanda = await Comanda.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('mesa')
      .preload('pedidos', (query) => {
        query
          .whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
          .orderBy('created_at', 'asc')
          .preload('items', (itemQuery) => {
            itemQuery.orderBy('id', 'asc')
          })
      })
      .first()

    if (!comanda) {
      return response.notFound('Comanda não encontrada')
    }

    // Calcular total de todos os pedidos ativos
    let totalComanda = 0
    let totalDiscount = 0
    let totalServiceCharge = 0
    const allItems: any[] = []

    for (const pedido of comanda.pedidos) {
      totalComanda += Number(pedido.total || 0)
      totalDiscount += Number(pedido.discount || 0)
      totalServiceCharge += Number(pedido.serviceCharge || 0)
      for (const item of pedido.items) {
        const unitPrice = Number(item.unitPrice || 0)
        const quantity = Number(item.quantity || 0)
        const subtotal = Number((item as any).totalPrice ?? unitPrice * quantity)

        allItems.push({
          itemName: item.itemName,
          quantity: quantity,
          unitPrice: unitPrice,
          subtotal: subtotal,
          notes: (item as any).specialInstructions || null,
        })
      }
    }

    const empresaModule = await import('#models/empresa')
    const EmpresaModel = empresaModule.default
    const empresa = await EmpresaModel.findOrFail(user.empresaId)

    // Serializar comanda e empresa
    const comandaSerialized = {
      ...comanda.serialize(),
      totalComanda,
      totalDiscount,
      totalServiceCharge,
      allItems,
    }

    const empresaSerialized = {
      ...empresa.serialize(),
      formattedCnpj: empresa.formattedCnpj,
      formattedDocument: empresa.formattedDocument,
      fullAddress: empresa.fullAddress,
    }

    return view.render('comandas/print', {
      comanda: comandaSerialized,
      empresa: empresaSerialized,
    })
  }

  /**
   * API: Lista comandas ativas
   */
  async apiActive({ response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const comandas = await Comanda.activeTables()
      .where('empresa_id', user.empresaId)
      .orderByRaw('CAST(number AS INTEGER) ASC')
      .select('id', 'number', 'name')

    return response.json(comandas)
  }

  async api(ctx: HttpContext) {
    return this.apiActive(ctx)
  }
}
