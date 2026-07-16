import type { HttpContext } from '@adonisjs/core/http'
import Mesa from '#models/mesa'
import vine from '@vinejs/vine'
import cloudLogger from '#services/cloud_logger'

export default class MesasController {
  /**
   * Lista todas as mesas
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const location = request.input('location', '')
    const activeOnly = request.input('active_only', false)

    let query = Mesa.query()
      .where('empresa_id', user.empresaId)
      .withCount('comandas', (comandasQuery) => {
        comandasQuery.where('active', true)
      })

    if (search) {
      query = query.where((builder) => {
        builder.where('number', 'ilike', `%${search}%`).orWhere('name', 'ilike', `%${search}%`)
      })
    }

    if (location) {
      query = query.where('location', location)
    }

    if (activeOnly) {
      query = query.where('active', true)
    }

    const mesas = await query
      .orderBy('sort_order', 'asc')
      .orderByRaw('CAST(number AS INTEGER) ASC')
      .paginate(page, 20)

    // Buscar localizações únicas para filtro
    const locations = await Mesa.query()
      .where('empresa_id', user.empresaId)
      .whereNotNull('location')
      .distinct('location')
      .select('location')

    return view.render('mesas/index', {
      mesas: mesas.serialize(),
      locations: locations.map((l) => l.location),
      filters: { search, location, activeOnly },
    })
  }

  /**
   * Exibe formulário para criar nova mesa
   */
  async create({ view }: HttpContext) {
    // const user = await auth.authenticate()
    return view.render('mesas/create')
  }

  /**
   * Armazena nova mesa
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    logger.info(`[MESAS STORE] User ${user.id} creating new mesa`)

    try {
      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            number: vine.string().maxLength(20),
            name: vine.string().optional(),
            location: vine.string().optional(),
            capacity: vine.number().optional(),
            status: vine.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
            active: vine.string().optional(),
          })
        )
      )

      // Verificar se o número da mesa já existe
      const existingMesa = await Mesa.query()
        .where('empresa_id', user.empresaId)
        .where('number', data.number)
        .first()

      if (existingMesa) {
        session.flash('error', 'Já existe uma mesa com este número.')
        return response.redirect().back()
      }

      const isActive = Boolean(data.active)
      const status = isActive ? data.status || 'available' : 'maintenance'

      const mesa = await Mesa.create({
        empresaId: user.empresaId,
        number: data.number,
        name: data.name,
        location: data.location,
        capacity: data.capacity,
        status,
        active: isActive,
      })

      logger.info(
        `[MESAS STORE] SUCCESS | Mesa ID: ${mesa.id} | Number: ${mesa.number} | User: ${user.id}`
      )
      cloudLogger.info('MESA_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        mesaId: mesa.id,
        mesaNumber: mesa.number,
      })

      session.flash('success', 'Mesa criada com sucesso!')
      return response.redirect().toRoute('mesas.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(`[MESAS STORE] ERROR | User ${errorUser.id} | Error: ${error.message}`)
      cloudLogger.error('MESA_CREATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao criar mesa.')
      return response.redirect().back()
    }
  }

  /**
   * Exibe uma mesa específica com suas comandas
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('comandas', (query) => {
        query.where('active', true).orderBy('number', 'asc')
      })
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    return view.render('mesas/show', {
      mesa: mesa.serialize(),
    })
  }

  /**
   * Exibe formulário para editar mesa
   */
  async edit({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    return view.render('mesas/edit', {
      mesa: mesa.serialize(),
    })
  }

  /**
   * Atualiza mesa
   */
  async update({ request, response, params, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    logger.info(`[MESAS UPDATE] User ${user.id} updating mesa ${params.id}`)

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    const data = await request.validateUsing(
      vine.compile(
        vine.object({
          number: vine.string().maxLength(20),
          name: vine.string().optional(),
          location: vine.string().optional(),
          capacity: vine.number().optional(),
          status: vine.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
          active: vine.accepted().optional(),
        })
      )
    )

    try {
      // Verificar se o número da mesa já existe (exceto a atual)
      const existingMesa = await Mesa.query()
        .where('empresa_id', user.empresaId)
        .where('number', data.number)
        .whereNot('id', mesa.id)
        .first()

      if (existingMesa) {
        session.flash('error', 'Já existe uma mesa com este número.')
        return response.redirect().back()
      }

      const isActive = !!data.active
      const status = isActive ? data.status || 'available' : 'maintenance'

      mesa.merge({
        number: data.number,
        name: data.name,
        location: data.location,
        capacity: data.capacity,
        status,
        active: isActive,
      })

      await mesa.save()

      logger.info(`[MESAS UPDATE] SUCCESS | Mesa ${mesa.id} updated by user ${user.id}`)
      cloudLogger.info('MESA_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        mesaId: mesa.id,
        mesaNumber: mesa.number,
      })

      session.flash('success', 'Mesa atualizada com sucesso!')
      return response.redirect().toRoute('mesas.show', [mesa.id])
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[MESAS UPDATE] ERROR | Mesa ${params.id} | User ${errorUser.id} | Error: ${error.message}`
      )
      cloudLogger.error('MESA_UPDATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao atualizar mesa.')
      return response.redirect().back()
    }
  }

  /**
   * Remove mesa
   */
  async destroy({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    logger.info(`[MESAS DESTROY] User ${user.id} attempting to delete mesa ${params.id}`)

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    try {
      // Verificar se há comandas vinculadas
      const comandaCount = await mesa.getComandaCount()

      if (comandaCount > 0) {
        session.flash('error', 'Não é possível excluir uma mesa que possui comandas vinculadas.')
        return response.redirect().back()
      }

      const mesaId = mesa.id
      const mesaNumber = mesa.number
      await mesa.delete()

      logger.info(`[MESAS DESTROY] SUCCESS | Mesa ${mesaId} deleted by user ${user.id}`)
      cloudLogger.info('MESA_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        mesaId: mesaId,
        mesaNumber: mesaNumber,
      })

      session.flash('success', 'Mesa removida com sucesso!')
      return response.redirect().toRoute('mesas.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      logger.error(
        `[MESAS DESTROY] ERROR | Mesa ${params.id} | User ${errorUser.id} | Error: ${error.message}`
      )
      cloudLogger.error('MESA_DELETE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao remover mesa.')
      return response.redirect().back()
    }
  }

  /**
   * Ativa/desativa mesa
   */
  async toggleActive({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    logger.info(`[MESAS TOGGLE_ACTIVE] User ${user.id} toggling mesa ${params.id}`)

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    try {
      mesa.active = !mesa.active
      if (!mesa.active) {
        // Inativa sempre vira manutenção para evitar mesa "disponível" inativa
        mesa.status = 'maintenance'
      }
      await mesa.save()

      logger.info(
        `[MESAS TOGGLE_ACTIVE] SUCCESS | Mesa ${mesa.id} is now ${mesa.active ? 'active' : 'inactive'} | User ${user.id}`
      )
      session.flash('success', `Mesa ${mesa.active ? 'ativada' : 'desativada'} com sucesso!`)
      return response.redirect().back()
    } catch (error) {
      logger.error(
        `[MESAS TOGGLE_ACTIVE] ERROR | Mesa ${params.id} | User ${user.id} | Error: ${error.message}`
      )
      session.flash('error', 'Erro ao alterar status da mesa.')
      return response.redirect().back()
    }
  }

  /**
   * Atualiza somente o status da mesa (rápido), usado na página de Comanda.
   */
  async updateStatus({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    logger.info(`[MESAS UPDATE_STATUS] User ${user.id} updating status for mesa ${params.id}`)

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!mesa) {
      return response.notFound('Mesa não encontrada')
    }

    const data = await request.validateUsing(
      vine.compile(
        vine.object({
          status: vine.enum(['available', 'occupied', 'reserved', 'maintenance']),
        })
      )
    )

    try {
      mesa.status = data.status
      await mesa.save()

      logger.info(
        `[MESAS UPDATE_STATUS] SUCCESS | Mesa ${mesa.id} status -> ${mesa.status} | User ${user.id}`
      )
      session.flash('success', 'Status da mesa atualizado!')
      return response.redirect().back()
    } catch (error) {
      logger.error(
        `[MESAS UPDATE_STATUS] ERROR | Mesa ${params.id} | User ${user.id} | Error: ${error.message}`
      )
      session.flash('error', 'Erro ao atualizar status da mesa.')
      return response.redirect().back()
    }
  }

  /**
   * API: Retorna status atual da mesa (para polling/auto-atualização)
   */
  async getStatus({ params, response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    logger.info(`[MESAS GET_STATUS] User ${user.id} checking status for mesa ${params.id}`)

    const mesa = await Mesa.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .select('id', 'status', 'number', 'name')
      .first()

    if (!mesa) {
      return response.notFound({ error: 'Mesa não encontrada' })
    }

    return response.json({
      id: mesa.id,
      status: mesa.status,
      number: mesa.number,
      name: mesa.name,
    })
  }
}
