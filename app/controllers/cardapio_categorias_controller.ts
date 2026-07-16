import type { HttpContext } from '@adonisjs/core/http'
import CardapioCategoria from '#models/cardapio_categoria'
import vine from '@vinejs/vine'
import cloudLogger from '#services/cloud_logger'

export default class CardapioCategoriasController {
  /**
   * Lista todas as categorias
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    const search = request.input('search', '')

    let query = CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .withCount('cardapioProdutos')

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    const categorias = await query.orderBy('sortOrder', 'asc').orderBy('name', 'asc')

    return view.render('cardapio/categorias/index', {
      user,
      empresa: user.empresa,
      role: user.role,
      categorias,
      filters: { search },
    })
  }

  /**
   * Formulário de criação
   */
  async create({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    return view.render('cardapio/categorias/create', {
      user,
      empresa: user.empresa,
      role: user.role,
    })
  }

  /**
   * Processa criação da categoria
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const createSchema = vine.object({
      name: vine.string().minLength(2).maxLength(100),
      description: vine.string().optional(),
      color: vine.string().regex(/^#[0-9A-F]{6}$/i),
      sort_order: vine.number().min(0),
      active: vine.string().optional(),
      show_in_menu: vine.string().optional(),
      available_from: vine.string().optional(),
      available_until: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: createSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const categoria = await CardapioCategoria.create({
        empresaId: user.empresaId,
        name: data.name,
        description: data.description,
        color: data.color,
        sortOrder: data.sort_order,
        active: Boolean(data.active),
        showInMenu: Boolean(data.show_in_menu),
        availableFrom: data.available_from,
        availableUntil: data.available_until,
      })

      logger.info(
        `[CARDAPIO_CATEGORIAS STORE] SUCCESS | Categoria ID: ${categoria.id} | Name: ${categoria.name} | User: ${user.id}`
      )
      cloudLogger.info('CARDAPIO_CATEGORIA_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        categoriaId: categoria.id,
        categoriaName: categoria.name,
      })

      session.flash('success', 'Categoria criada com sucesso!')
      return response.redirect().toRoute('cardapio_categorias.show', { id: categoria.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[CREATE CATEGORIA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('CARDAPIO_CATEGORIA_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [CREATE CATEGORIA] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', `Erro ao criar categoria: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Exibe detalhes da categoria
   */
  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    const categoria = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .preload('cardapioProdutos', (query) => {
        query.orderBy('sortOrder', 'asc').orderBy('name', 'asc')
      })
      .firstOrFail()

    return view.render('cardapio/categorias/show', {
      user,
      empresa: user.empresa,
      role: user.role,
      categoria,
    })
  }

  /**
   * Formulário de edição
   */
  async edit({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    const categoria = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .firstOrFail()

    return view.render('cardapio/categorias/edit', {
      user,
      empresa: user.empresa,
      role: user.role,
      categoria,
    })
  }

  /**
   * Processa atualização da categoria
   */
  async update({ params, request, response, session, auth, logger }: HttpContext) {
    const updateSchema = vine.object({
      name: vine.string().minLength(2).maxLength(100),
      description: vine.string().optional(),
      color: vine.string().regex(/^#[0-9A-F]{6}$/i),
      sort_order: vine.number().min(0),
      active: vine.string().optional(),
      show_in_menu: vine.string().optional(),
      available_from: vine.string().optional(),
      available_until: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: updateSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const categoria = await CardapioCategoria.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      categoria.merge({
        name: data.name,
        description: data.description,
        color: data.color,
        sortOrder: data.sort_order,
        active: Boolean(data.active),
        showInMenu: Boolean(data.show_in_menu),
        availableFrom: data.available_from,
        availableUntil: data.available_until,
      })

      await categoria.save()

      logger.info(`[UPDATE CATEGORIA] Category updated successfully: ${categoria.id}`)
      cloudLogger.info('CARDAPIO_CATEGORIA_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        categoriaId: categoria.id,
        categoriaName: categoria.name,
      })

      session.flash('success', 'Categoria atualizada com sucesso!')
      return response.redirect().toRoute('cardapio_categorias.show', { id: categoria.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[UPDATE CATEGORIA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('CARDAPIO_CATEGORIA_UPDATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [UPDATE CATEGORIA] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', `Erro ao atualizar categoria: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Remove a categoria
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')

      const categoria = await CardapioCategoria.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .preload('cardapioProdutos')
        .firstOrFail()

      // Verificar se há itens na categoria
      if (categoria.cardapioProdutos.length > 0) {
        session.flash('error', 'Não é possível remover uma categoria que possui itens')
        return response.redirect().back()
      }

      const categoriaId = categoria.id
      const categoriaName = categoria.name
      await categoria.delete()

      cloudLogger.info('CARDAPIO_CATEGORIA_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        categoriaId: categoriaId,
        categoriaName: categoriaName,
      })

      session.flash('success', 'Categoria removida com sucesso!')
      return response.redirect().toRoute('cardapio_categories.index')
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('CARDAPIO_CATEGORIA_DELETE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao remover categoria')
      return response.redirect().back()
    }
  }

  /**
   * Atualizar ordem das categorias
   */
  async updateOrder({ request, response, session, auth }: HttpContext) {
    const orderSchema = vine.object({
      categorias: vine.array(
        vine.object({
          id: vine.number(),
          sort_order: vine.number(),
        })
      ),
    })

    try {
      const data = await vine.validate({
        schema: orderSchema,
        data: request.all(),
      })

      const user = await auth.authenticate()

      // Atualizar ordem de cada categoria
      for (const item of data.categorias) {
        await CardapioCategoria.query()
          .where('empresa_id', user.empresaId)
          .where('id', item.id)
          .update({ sortOrder: item.sort_order })
      }

      session.flash('success', 'Ordem das categorias atualizada!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao atualizar ordem')
      return response.redirect().back()
    }
  }

  /**
   * Toggle status ativo da categoria
   */
  async toggleActive({ params, response, session, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')
      const categoria = await CardapioCategoria.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      await categoria.toggleActive()

      const status = categoria.active ? 'ativada' : 'desativada'
      session.flash('success', `Categoria ${status} com sucesso!`)
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao alterar status da categoria')
      return response.redirect().back()
    }
  }

  /**
   * API: Lista categorias para select
   */
  async api({ request, response, auth }: HttpContext) {
    const user = await auth.authenticate()
    const search = request.input('search', '')

    let query = CardapioCategoria.query().where('empresa_id', user.empresaId).where('active', true)

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    const categorias = await query
      .select('id', 'name', 'color')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
      .limit(20)

    return response.json(categorias)
  }
}
