import type { HttpContext } from '@adonisjs/core/http'
import CardapioVirtual from '#models/cardapio_virtual'
import CardapioCategoria from '#models/cardapio_categoria'
import CardapioProduto from '#models/cardapio_produto'
import vine from '@vinejs/vine'
import string from '@adonisjs/core/helpers/string'
import { DateTime } from 'luxon'
import cloudLogger from '#services/cloud_logger'

export default class CardapiosVirtuaisController {
  async index({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    const menusResult = await CardapioVirtual.query()
      .where('empresa_id', user.empresaId)
      .orderBy('created_at', 'desc')
    const cardapiosVirtuais = Array.isArray(menusResult) ? menusResult : []
    return view.render('cardapio/cardapios_virtuais/index', { cardapiosVirtuais })
  }

  async create({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    return view.render('cardapio/cardapios_virtuais/create', { empresa: user.empresa })
  }

  async store({ request, response, session, auth, logger }: HttpContext) {
    const schema = vine.object({
      title: vine.string().minLength(3).maxLength(200),
      description: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({ schema, data: rawData })

      const user = await auth.authenticate()
      await user.load('empresa')
      let slug = string.slug(data.title)
      const existingSlug = await CardapioVirtual.query().where('slug', slug).first()
      if (existingSlug) slug = `${slug}-${Date.now()}`
      const cardapioVirtual = await CardapioVirtual.create({
        empresaId: user.empresaId,
        title: data.title,
        description: data.description,
        slug,
        status: 'draft',
        theme: 'default',
      })
      logger.info(
        `[CARDAPIOS_VIRTUAIS STORE] SUCCESS | CardapioVirtual ID: ${cardapioVirtual.id} | Title: ${cardapioVirtual.title} | Slug: ${slug} | User: ${user.id}`
      )
      cloudLogger.info('CARDAPIO_VIRTUAL_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        cardapioVirtualId: cardapioVirtual.id,
        title: cardapioVirtual.title,
      })

      session.flash('success', 'Cardápio virtual criado!')
      return response.redirect().toRoute('cardapios_virtuais.show', { id: cardapioVirtual.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[STORE CARDAPIO VIRTUAL] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('CARDAPIO_VIRTUAL_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [STORE CARDAPIO VIRTUAL] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao criar cardápio virtual')
      return response.redirect().back()
    }
  }

  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    const cardapioVirtual = await CardapioVirtual.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('empresa')
      .firstOrFail()
    return view.render('cardapio/cardapios_virtuais/show', { cardapioVirtual })
  }

  async edit({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    const cardapioVirtual = await CardapioVirtual.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('empresa')
      .firstOrFail()
    return view.render('cardapio/cardapios_virtuais/edit', { cardapioVirtual })
  }

  async update({ params, request, response, session, auth, logger }: HttpContext) {
    const schema = vine.object({
      title: vine.string().minLength(3).maxLength(200),
      description: vine.string().optional(),
      theme: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({ schema, data: rawData })

      const user = await auth.authenticate()
      await user.load('empresa')
      const cardapioVirtual = await CardapioVirtual.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      cardapioVirtual.title = data.title
      cardapioVirtual.description = data.description ?? null
      if (data.theme) {
        cardapioVirtual.theme = data.theme
      }

      // Atualizar slug se o título mudou
      const newSlug = string.slug(data.title)
      if (newSlug !== cardapioVirtual.slug) {
        const existingSlug = await CardapioVirtual.query()
          .where('slug', newSlug)
          .whereNot('id', cardapioVirtual.id)
          .first()
        cardapioVirtual.slug = existingSlug ? `${newSlug}-${Date.now()}` : newSlug
      }

      await cardapioVirtual.save()
      logger.info(
        `[CARDAPIOS_VIRTUAIS UPDATE] SUCCESS | CardapioVirtual ${cardapioVirtual.id} updated by user ${user.id}`
      )
      cloudLogger.info('CARDAPIO_VIRTUAL_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        cardapioVirtualId: cardapioVirtual.id,
        title: cardapioVirtual.title,
      })

      session.flash('success', 'Cardápio virtual atualizado!')
      return response.redirect().toRoute('cardapios_virtuais.show', { id: cardapioVirtual.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[UPDATE CARDAPIO VIRTUAL] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('CARDAPIO_VIRTUAL_UPDATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [UPDATE CARDAPIO VIRTUAL] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao atualizar cardápio virtual')
      return response.redirect().back()
    }
  }

  async togglePublish({ params, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()
    const cardapioVirtual = await CardapioVirtual.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()
    if (cardapioVirtual.status === 'draft') {
      cardapioVirtual.status = 'published'
      cardapioVirtual.publishedAt = DateTime.now()
      session.flash('success', 'Cardápio publicado!')
    } else {
      cardapioVirtual.status = 'draft'
      cardapioVirtual.publishedAt = null
      session.flash('success', 'Cardápio despublicado!')
    }
    await cardapioVirtual.save()
    return response.redirect().back()
  }

  async destroy({ params, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    const cardapioVirtual = await CardapioVirtual.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()

    const cardapioVirtualId = cardapioVirtual.id
    const title = cardapioVirtual.title
    await cardapioVirtual.delete()

    cloudLogger.info('CARDAPIO_VIRTUAL_DELETED', {
      userId: user.id,
      empresaId: user.empresaId,
      cnpj: user.empresa?.cnpj,
      cardapioVirtualId: cardapioVirtualId,
      title: title,
    })

    session.flash('success', 'Cardápio excluído!')
    return response.redirect().toRoute('cardapios_virtuais.index')
  }

  async public({ params, view, response }: HttpContext) {
    const cardapioVirtual = await CardapioVirtual.query()
      .where('slug', params.slug)
      .where('status', 'published')
      .preload('empresa')
      .first()
    if (!cardapioVirtual) return response.status(404).send('Cardápio não encontrado')
    const categories = await CardapioCategoria.query()
      .where('empresa_id', cardapioVirtual.empresaId)
      .where('active', true)
      .orderBy('sort_order', 'asc')
    const produtos = await CardapioProduto.query()
      .where('empresa_id', cardapioVirtual.empresaId)
      .where('active', true)
      .where('available', true)
      .preload('cardapioCategoria')
      .preload('ingredientes', (query) => {
        query.preload('insumo')
      })
      .orderBy('name', 'asc')
    const itemsByCategory = categories.map((categoria) => ({
      categoria,
      items: produtos.filter((produto) => produto.cardapioCategoriaId === categoria.id),
    }))
    return view.render('cardapio/cardapios_virtuais/public', {
      cardapioVirtual,
      itemsByCategory,
    })
  }
}
