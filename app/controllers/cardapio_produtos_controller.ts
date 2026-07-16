import type { HttpContext } from '@adonisjs/core/http'
import CardapioProduto from '#models/cardapio_produto'
import CardapioCategoria from '#models/cardapio_categoria'
import CardapioProdutoIngrediente from '#models/cardapio_produto_ingrediente'
import Insumo from '#models/insumo'
import vine from '@vinejs/vine'
import { parseBRToNumber } from '../helpers/number_formatter.js'
import cloudLogger from '#services/cloud_logger'

// Slug simples para IDs de imagem
function slugify(text: string) {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default class CardapioProdutosController {
  /**
   * Lista todos os produtos do cardápio
   */
  async index({ view, request, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const category = request.input('category', '')
    const status = request.input('status', '')

    let query = CardapioProduto.query()
      .where('empresa_id', user.empresaId)
      .preload('cardapioCategoria')

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    if (category) {
      query = query.where('cardapio_categoria_id', category)
    }

    if (status === 'active') {
      query = query.where('active', true)
    } else if (status === 'inactive') {
      query = query.where('active', false)
    } else if (status === 'available') {
      query = query.where('active', true).where('available', true)
    }

    const produtos = await query.orderBy('name', 'asc').paginate(page, 15)

    // Buscar categorias para filtro
    const categorias = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('sortOrder', 'asc')
      .select('id', 'name')

    // Adicionar informações de quantidade máxima possível para cada produto
    const module = await import('../services/insumo_stock_service.js')
    const insumoStockService = module.default

    const produtosComAvailability = await Promise.all(
      produtos.all().map(async (product) => {
        const serialized = product.serialize()
        try {
          const maxPossibleQuantity = await insumoStockService.getMaxPossibleQuantity(product.id)
          return {
            ...serialized,
            maxPossibleQuantity,
            isAvailable: maxPossibleQuantity > 0,
          }
        } catch (error) {
          logger.error(
            `[AVAILABILITY ERROR] Erro ao calcular disponibilidade para produto ${product.id}:`,
            error.message
          )
          return {
            ...serialized,
            maxPossibleQuantity: 0,
            isAvailable: true, // Assumir que está disponível em caso de erro
          }
        }
      })
    )

    return view.render('cardapio/produtos/index', {
      produtos: produtosComAvailability,
      categorias,
      filters: { search, category, status },
    })
  }

  /**
   * Formulário de criação
   */
  async create({ view, auth }: HttpContext) {
    const user = await auth.authenticate()

    // Buscar categorias ativas
    const categorias = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('sortOrder', 'asc')

    // Buscar insumos do almoxarifado para adicionar como ingredientes
    const insumos = await Insumo.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('name', 'asc')
      .select('id', 'name', 'unit', 'current_stock', 'stock_control')

    return view.render('cardapio/produtos/create', { categorias, insumos })
  }

  /**
   * Processa criação do item
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const createSchema = vine.object({
      cardapio_categoria_id: vine.number(),
      name: vine.string().minLength(2).maxLength(255),
      description: vine.string().optional(),
      image_url: vine.string().optional(),
      cost_price: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      sale_price: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      markup_percentage: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      calories: vine.number().min(0).optional(),
      protein: vine.number().min(0).optional(),
      carbs: vine.number().min(0).optional(),
      fat: vine.number().min(0).optional(),
      active: vine.string().optional(),
      available: vine.string().optional(),
      sort_order: vine.number().min(0).optional(),
      preparation_time: vine.number().min(0).optional(),
      track_stock: vine.string().optional(),
      daily_limit: vine.number().min(1).optional(),
      available_from: vine.string().optional(),
      available_until: vine.string().optional(),
      available_days: vine.array(vine.number().min(0).max(6)).optional(),
      allergens: vine.string().optional(),
      vegetarian: vine.string().optional(),
      vegan: vine.string().optional(),
      gluten_free: vine.string().optional(),
      lactose_free: vine.string().optional(),
      tags: vine.string().optional(),
      spice_level: vine.enum(['none', 'mild', 'medium', 'hot', 'very_hot']).optional(),
      requires_preparation: vine.string().optional(),
      ingredients: vine
        .array(
          vine.object({
            insumo_id: vine.number(),
            quantity: vine
              .number()
              .min(0.01)
              .transform((value) => {
                // Se receber string (form-data), converter de formato brasileiro
                if (typeof value === 'string') {
                  return parseBRToNumber(value) ?? 0
                }
                return value
              }),
            unit: vine.string(),
          })
        )
        .optional(),
      // CAMPOS FISCAIS (obrigatórios para NFC-e)
      ncm: vine.string().regex(/^[0-9]{8}$/),
      cfop: vine.string().regex(/^[0-9]{4}$/),
      cst_icms: vine.string().optional(),
      csosn: vine.string().optional(),
      unit: vine.enum(['UN', 'KG', 'LT', 'PC', 'CX']),
      icms_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      pis_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      cofins_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      cest: vine
        .string()
        .regex(/^[0-9]{7}$/)
        .optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: createSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      // Upload de imagem para Cloudflare Images (se presente)
      let imageUrl: string | null = null
      let imageFilename: string | null = null

      const imageFile = request.file('image', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })

      if (imageFile && imageFile.tmpPath) {
        try {
          const cloudflareModule = await import('#services/cloudflare_images_service')
          const CloudflareImagesService = cloudflareModule.default
          const cf = new CloudflareImagesService()
          imageFilename = imageFile.clientName
          const productSlug = slugify(data.name)
          const ext = imageFilename.includes('.') ? imageFilename.split('.').pop() : 'img'
          const customId = `emp-${user.empresaId}-produto-${productSlug}-${Date.now()}.${ext}`
          const result = await cf.uploadFile(imageFile.tmpPath, imageFilename, imageFile.type, {
            customId,
          })
          imageUrl = result.url
          console.log(
            `🖼️ [STORE PRODUTO] Upload CF Images OK: id=${result.imageId} url=${result.url}`
          )
        } catch (err) {}
      }

      // Processar arrays de strings separadas por vírgula
      const allergens = data.allergens
        ? data.allergens
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null

      // Garantir que available_days seja um array válido ou null
      const availableDays =
        data.available_days && Array.isArray(data.available_days) ? data.available_days : null

      const produto = await CardapioProduto.create({
        empresaId: user.empresaId,
        cardapioCategoriaId: data.cardapio_categoria_id,
        name: data.name,
        description: data.description,
        imageUrl: imageUrl || data.image_url || null,
        costPrice: data.cost_price ?? 0,
        salePrice: data.sale_price,
        markupPercentage: data.markup_percentage ?? 0,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        active: Boolean(data.active),
        available: Boolean(data.available),
        sortOrder: data.sort_order ?? 0,
        preparationTime: data.preparation_time ?? 0,
        trackStock: Boolean(data.track_stock),
        dailyLimit: data.daily_limit,
        dailySold: 0,
        availableFrom: data.available_from,
        availableUntil: data.available_until,
        availableDays: availableDays,
        allergens: allergens,
        vegetarian: Boolean(data.vegetarian),
        vegan: Boolean(data.vegan),
        glutenFree: Boolean(data.gluten_free),
        lactoseFree: Boolean(data.lactose_free),
        tags: tags,
        spiceLevel: data.spice_level ?? 'none',
        requiresPreparation: Boolean(data.requires_preparation),
        // DADOS FISCAIS
        ncm: data.ncm,
        cfop: data.cfop,
        cstIcms: data.cst_icms,
        csosn: data.csosn,
        unit: data.unit,
        icmsRate: data.icms_rate ?? 0,
        pisRate: data.pis_rate ?? 0.65,
        cofinsRate: data.cofins_rate ?? 3.0,
        cest: data.cest,
      })

      // Adicionar ingredientes se fornecidos
      if (data.ingredients && data.ingredients.length > 0) {
        for (const ingredientData of data.ingredients) {
          const insumo = await Insumo.find(ingredientData.insumo_id)
          if (insumo) {
            await CardapioProdutoIngrediente.create({
              cardapioProdutoId: produto.id,
              insumoId: ingredientData.insumo_id,
              quantity: ingredientData.quantity,
              unit: ingredientData.unit,
              // Usar o preço de compra do insumo como custo unitário do ingrediente
              unitCost: insumo.purchasePrice || 0,
              totalCost: (insumo.purchasePrice || 0) * ingredientData.quantity,
              optional: false,
              sortOrder: 0,
            })
          }
        }
        // Recalcular custo baseado nos ingredientes
        const ingredientsCost = await this.recalculateCost(produto)

        // Regra: preço de custo do produto deve ser >= soma dos custos dos ingredientes
        // Usar parseBRToNumber para converter corretamente valores em formato brasileiro
        const providedCost = data.cost_price ?? 0
        const enforcedCost = Math.max(providedCost, ingredientsCost)

        await CardapioProduto.query().where('id', produto.id).update({ costPrice: enforcedCost })
        produto.costPrice = enforcedCost

        // Preço de venda calculado automaticamente: costPrice * (1 + markup/100)
        const markup = Number(produto.markupPercentage || 0) || 0
        const autoSalePrice = enforcedCost * (1 + markup / 100)
        await CardapioProduto.query().where('id', produto.id).update({ salePrice: autoSalePrice })
        produto.salePrice = autoSalePrice
      }

      cloudLogger.info('CARDAPIO_PRODUTO_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        produtoId: produto.id,
        produtoName: produto.name,
        salePrice: produto.salePrice,
      })

      session.flash('success', 'Produto criado com sucesso!')
      return response.redirect().toRoute('cardapio_produtos.show', { id: produto.id })
    } catch (error) {
      logger.error(
        `[STORE PRODUTO] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('CARDAPIO_PRODUTO_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [STORE PRODUTO] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', `Erro ao criar produto: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Exibe detalhes do item
   */
  async show({ params, view, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    const produto = await CardapioProduto.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .preload('cardapioCategoria')
      .preload('ingredientes', (query) => {
        query.preload('insumo').orderBy('sortOrder', 'asc')
      })
      .firstOrFail()

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    // Formatar dias disponíveis
    const availableDaysFormatted = produto.availableDays
      ? produto.availableDays.map((day) => dayNames[day]).join(', ')
      : null

    // Adicionar informações de quantidade máxima possível
    let maxPossibleQuantity = 0
    let isAvailable = true
    try {
      const module = await import('../services/insumo_stock_service.js')
      const insumoStockService = module.default
      maxPossibleQuantity = await insumoStockService.getMaxPossibleQuantity(produto.id)
      isAvailable = maxPossibleQuantity > 0
    } catch (error) {
      logger.error(
        `[AVAILABILITY ERROR] Erro ao calcular disponibilidade para produto ${params.id}:`,
        error.message
      )
      maxPossibleQuantity = 0
      isAvailable = true // Assumir disponível em caso de erro
    }

    return view.render('cardapio/produtos/show', {
      produto,
      availableDaysFormatted,
      maxPossibleQuantity,
      isAvailable,
    })
  }

  /**
   * Formulário de edição
   */
  async edit({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()

    const produto = await CardapioProduto.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .preload('cardapioCategoria')
      .preload('ingredientes', (query) => {
        query.preload('insumo').orderBy('sortOrder', 'asc')
      })
      .firstOrFail()

    // Buscar categorias ativas
    const categorias = await CardapioCategoria.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('sortOrder', 'asc')

    // Buscar insumos do almoxarifado para adicionar como ingredientes
    const insumos = await Insumo.query()
      .where('empresa_id', user.empresaId)
      .where('active', true)
      .orderBy('name', 'asc')
      .select('id', 'name', 'unit', 'current_stock', 'stock_control')

    return view.render('cardapio/produtos/edit', { produto, categorias, insumos })
  }

  /**
   * Processa atualização do item
   */
  async update({ params, request, response, session, auth, logger }: HttpContext) {
    const updateSchema = vine.object({
      cardapio_categoria_id: vine.number(),
      name: vine.string().minLength(2).maxLength(255),
      description: vine.string().optional(),
      image_url: vine.string().optional(),
      cost_price: vine.string().transform((value) => {
        const parsed = parseBRToNumber(value)
        if (parsed === null || parsed === undefined) {
          throw new Error('Preço de custo é obrigatório')
        }
        return parsed
      }),
      sale_price: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      markup_percentage: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      calories: vine.number().min(0).optional(),
      protein: vine.number().min(0).optional(),
      carbs: vine.number().min(0).optional(),
      fat: vine.number().min(0).optional(),
      active: vine
        .string()
        .optional()
        .transform((value) => {
          if (Array.isArray(value)) return value[value.length - 1]
          return value
        }),
      available: vine
        .string()
        .optional()
        .transform((value) => {
          if (Array.isArray(value)) return value[value.length - 1]
          return value
        }),
      sort_order: vine.number().min(0).optional(),
      preparation_time: vine.number().min(0).optional(),
      track_stock: vine
        .string()
        .optional()
        .transform((value) => {
          if (Array.isArray(value)) return value[value.length - 1]
          return value
        }),
      daily_limit: vine.number().min(1).optional(),
      daily_sold: vine.number().min(0).optional(),
      available_from: vine.string().optional(),
      available_until: vine.string().optional(),
      available_days: vine.array(vine.number().min(0).max(6)).optional(),
      allergens: vine.string().optional(),
      vegetarian: vine.string().optional(),
      vegan: vine.string().optional(),
      gluten_free: vine.string().optional(),
      lactose_free: vine.string().optional(),
      tags: vine.string().optional(),
      spice_level: vine.enum(['none', 'mild', 'medium', 'hot', 'very_hot']).optional(),
      requires_preparation: vine.string().optional(),
      // CAMPOS FISCAIS (obrigatórios para NFC-e)
      ncm: vine.string().regex(/^[0-9]{8}$/),
      cfop: vine.string().regex(/^[0-9]{4}$/),
      cst_icms: vine.string().optional(),
      csosn: vine.string().optional(),
      unit: vine.enum(['UN', 'KG', 'LT', 'PC', 'CX']),
      icms_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      pis_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      cofins_rate: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      cest: vine
        .string()
        .regex(/^[0-9]{7}$/)
        .optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: updateSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const produto = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      // Upload de imagem para Cloudflare Images (se presente)
      const imageFile = request.file('image', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })

      if (imageFile && imageFile.tmpPath) {
        try {
          const cloudflareModule = await import('#services/cloudflare_images_service')
          const CloudflareImagesService = cloudflareModule.default
          const cf = new CloudflareImagesService()

          // Deletar imagem antiga se existir
          if (produto.imageUrl) {
            try {
              const del = await cf.deleteImageByUrl(produto.imageUrl)
              if (del?.notFound) {
                logger.info(
                  `[UPDATE PRODUTO] Imagem anterior já não existia no Cloudflare (${produto.imageUrl})`
                )
              } else {
                logger.info(
                  `[UPDATE PRODUTO] Imagem anterior removida da Cloudflare (${produto.imageUrl})`
                )
              }
            } catch (deleteErr) {
              logger.warn(
                `[UPDATE PRODUTO] Falha ao remover imagem antiga da Cloudflare: ${deleteErr}`
              )
            }
          }

          const imageFilename = imageFile.clientName
          const productSlug = slugify(data.name || produto.name)
          const ext = imageFilename.includes('.') ? imageFilename.split('.').pop() : 'img'
          const customId = `emp-${user.empresaId}-produto-${productSlug}-${Date.now()}.${ext}`
          const result = await cf.uploadFile(imageFile.tmpPath, imageFilename, imageFile.type, {
            customId,
          })
          produto.imageUrl = result.url

          console.log(
            `🖼️ [UPDATE PRODUTO] Upload CF Images OK: id=${result.imageId} url=${result.url}`
          )
        } catch (err) {}
      }

      // Processar arrays de strings separadas por vírgula
      const allergens = data.allergens
        ? data.allergens
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : null

      // Garantir que available_days seja um array válido ou null
      const availableDays =
        data.available_days && Array.isArray(data.available_days) ? data.available_days : null

      produto.merge({
        cardapioCategoriaId: data.cardapio_categoria_id,
        name: data.name,
        description: data.description,
        costPrice: data.cost_price ?? produto.costPrice,
        // salePrice será calculado automaticamente, ignorar entrada manual
        markupPercentage: data.markup_percentage ?? produto.markupPercentage,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        active: Boolean(data.active),
        available: Boolean(data.available),
        sortOrder: data.sort_order ?? produto.sortOrder,
        preparationTime: data.preparation_time ?? produto.preparationTime,
        trackStock: Boolean(data.track_stock),
        dailyLimit: data.daily_limit,
        dailySold: data.daily_sold ?? produto.dailySold,
        availableFrom: data.available_from,
        availableUntil: data.available_until,
        availableDays: availableDays,
        allergens: allergens,
        vegetarian: Boolean(data.vegetarian),
        vegan: Boolean(data.vegan),
        glutenFree: Boolean(data.gluten_free),
        lactoseFree: Boolean(data.lactose_free),
        tags: tags,
        spiceLevel: data.spice_level ?? produto.spiceLevel,
        requiresPreparation: Boolean(data.requires_preparation),
        // DADOS FISCAIS
        ncm: data.ncm,
        cfop: data.cfop,
        cstIcms: data.cst_icms,
        csosn: data.csosn,
        unit: data.unit,
        icmsRate: data.icms_rate ?? produto.icmsRate,
        pisRate: data.pis_rate ?? produto.pisRate,
        cofinsRate: data.cofins_rate ?? produto.cofinsRate,
        cest: data.cest,
      })

      await produto.save()

      // Recalcular custo dos ingredientes e aplicar regra: costPrice >= soma dos custos
      const ingredientsCost = await this.recalculateCost(produto)
      // Usar parseBRToNumber para converter corretamente valores em formato brasileiro (ex: "35,00" -> 35)
      const providedCost = data.cost_price ?? produto.costPrice ?? 0
      const enforcedCost = Math.max(providedCost, ingredientsCost)
      await CardapioProduto.query().where('id', produto.id).update({ costPrice: enforcedCost })
      produto.costPrice = enforcedCost

      // Calcular automaticamente o preço de venda pelo markup
      const markup = parseBRToNumber(produto.markupPercentage?.toString()) ?? 0
      const autoSalePrice = enforcedCost * (1 + markup / 100)
      await CardapioProduto.query().where('id', produto.id).update({ salePrice: autoSalePrice })
      produto.salePrice = autoSalePrice

      cloudLogger.info('CARDAPIO_PRODUTO_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        produtoId: produto.id,
        produtoName: produto.name,
        salePrice: produto.salePrice,
      })

      session.flash('success', 'Item atualizado com sucesso!')
      return response.redirect().toRoute('cardapio_produtos.show', { id: produto.id })
    } catch (error) {
      logger.error(
        `[UPDATE PRODUTO] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('CARDAPIO_PRODUTO_UPDATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [UPDATE PRODUTO] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao atualizar item')
      return response.redirect().back()
    }
  }

  /**
   * Adicionar ingrediente ao produto
   */
  async addIngredient({ params, request, response, session, auth, logger }: HttpContext) {
    const ingredientSchema = vine.object({
      insumo_id: vine.number(),
      quantity: vine
        .number()
        .min(0.001)
        .transform((value) => {
          // Se receber string (form-data ou JSON), converter de formato brasileiro
          if (typeof value === 'string') {
            return parseBRToNumber(value) ?? 0
          }
          return value
        }),
      unit: vine.string().minLength(1),
      optional: vine.string().optional(),
      notes: vine.string().optional(),
    })

    try {
      const rawData = request.all()
      console.log('📝 [addIngredient] Raw data recebida:', rawData)

      const data = await vine.validate({
        schema: ingredientSchema,
        data: rawData,
      })

      console.log('✅ [addIngredient] Data validada:', {
        quantity: data.quantity,
        typeof: typeof data.quantity,
        stringified: String(data.quantity),
      })

      const user = await auth.authenticate()

      const produto = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      const insumo = await Insumo.query()
        .where('empresa_id', user.empresaId)
        .where('id', data.insumo_id)
        .firstOrFail()

      // Verificar se ingrediente já existe
      const existingIngredient = await CardapioProdutoIngrediente.query()
        .where('cardapio_produto_id', produto.id)
        .where('insumo_id', insumo.id)
        .first()

      if (existingIngredient) {
        session.flash('error', 'Este ingrediente já foi adicionado ao item')
        return response.redirect().back()
      }

      // Criar ingrediente
      const unitCost = insumo.purchasePrice || 0

      console.log('📝 [addIngredient] Salvando com valores:', {
        quantity: data.quantity,
        quantityType: typeof data.quantity,
        unitCost: unitCost,
        totalCost: data.quantity * unitCost,
      })

      await CardapioProdutoIngrediente.create({
        cardapioProdutoId: produto.id,
        insumoId: insumo.id,
        quantity: data.quantity,
        unit: data.unit,
        unitCost,
        totalCost: data.quantity * unitCost,
        optional: Boolean(data.optional),
        notes: data.notes,
        sortOrder: 0,
      })

      // Recalcular custo do produto
      await produto.calculateCostPrice()
      await produto.updateMarkupPrice()

      session.flash('success', 'Ingrediente adicionado com sucesso!')
      return response.redirect().toRoute('cardapio_produtos.show', { id: produto.id })
    } catch (error) {
      logger.error(
        `[ADD INGREDIENTE] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )

      if (error.messages) {
        console.log(
          '📋 [ADD INGREDIENTE] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Erro ao adicionar ingrediente')
      return response.redirect().back()
    }
  }

  /**
   * Calcular preço baseado no markup
   */
  async calculatePrice({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()

      logger.info(`[CARDAPIO_PRODUTOS CALCULATE_PRICE] User: ${user.id} | Product ID: ${params.id}`)

      const produto = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      await produto.calculateCostPrice()
      await produto.updateMarkupPrice()

      logger.info(
        `[CARDAPIO_PRODUTOS CALCULATE_PRICE] Success - Product: ${produto.id} | New Price: ${produto.salePrice}`
      )
      session.flash('success', 'Preço atualizado baseado no custo e markup!')
      return response.redirect().back()
    } catch (error) {
      logger.error(
        `[CARDAPIO_PRODUTOS CALCULATE_PRICE] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      session.flash('error', 'Erro ao calcular preço')
      return response.redirect().back()
    }
  }

  /**
   * Toggle disponibilidade do produto
   */
  async toggleAvailable({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()

      logger.info(
        `[CARDAPIO_PRODUTOS TOGGLE_AVAILABLE] User: ${user.id} | Product ID: ${params.id}`
      )

      const produto = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      await produto.toggleAvailable()

      const status = produto.available ? 'disponível' : 'indisponível'
      logger.info(
        `[CARDAPIO_PRODUTOS TOGGLE_AVAILABLE] Success - Product: ${produto.id} | New Status: ${status}`
      )
      session.flash('success', `Item marcado como ${status}!`)
      return response.redirect().back()
    } catch (error) {
      logger.error(
        `[CARDAPIO_PRODUTOS TOGGLE_AVAILABLE] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      session.flash('error', 'Erro ao alterar disponibilidade')
      return response.redirect().back()
    }
  }

  /**
   * Remove o produto
   */
  async destroy({ params, response, session, auth, logger }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')

      logger.info(`[CARDAPIO_PRODUTOS DESTROY] User: ${user.id} | Product ID: ${params.id}`)

      const produto = await CardapioProduto.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      const produtoName = produto.name
      const produtoId = produto.id
      const produtoImageUrl = produto.imageUrl

      // Deletar imagem do Cloudflare se existir
      if (produtoImageUrl) {
        try {
          const cloudflareModule = await import('#services/cloudflare_images_service')
          const CloudflareImagesService = cloudflareModule.default
          const cf = new CloudflareImagesService()
          const del = await cf.deleteImageByUrl(produtoImageUrl)
          if (del?.notFound) {
            logger.info(
              `[DESTROY PRODUTO] Imagem já não existia no Cloudflare (${produtoImageUrl})`
            )
          } else {
            logger.info(`[DESTROY PRODUTO] Imagem removida da Cloudflare (${produtoImageUrl})`)
          }
        } catch (deleteErr) {
          logger.warn(`[DESTROY PRODUTO] Falha ao remover imagem do Cloudflare: ${deleteErr}`)
        }
      }

      // Hard delete - remover ingredientes relacionados primeiro
      await CardapioProdutoIngrediente.query().where('cardapio_produto_id', produto.id).delete()

      // Deletar o produto
      await produto.delete()

      logger.info(
        `[CARDAPIO_PRODUTOS DESTROY] Success - Product: ${produtoId} (${produtoName}) permanently deleted`
      )
      cloudLogger.info('CARDAPIO_PRODUTO_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        produtoId: produtoId,
        produtoName: produtoName,
      })

      session.flash('success', 'Produto removido com sucesso!')
      return response.redirect().toRoute('cardapio_produtos.index')
    } catch (error) {
      logger.error(
        `[CARDAPIO_PRODUTOS DESTROY] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('CARDAPIO_PRODUTO_DELETE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      session.flash('error', 'Erro ao remover produto')
      return response.redirect().back()
    }
  }

  /**
   * API: Lista produtos para autocomplete
   */
  async api({ request, response, auth }: HttpContext) {
    const user = await auth.authenticate()
    const search = request.input('search', '')
    const category = request.input('category', '')

    let query = CardapioProduto.query().where('empresa_id', user.empresaId).where('active', true)

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    if (category) {
      query = query.where('cardapio_categoria_id', category)
    }

    const produtos = await query
      .select('id', 'name', 'sale_price', 'preparation_time')
      .orderBy('name', 'asc')
      .limit(20)

    return response.json(produtos)
  }

  /**
   * Retorna a imagem do produto (redireciona para CDN ou retorna 404)
   */
  async image({ params, response, logger }: HttpContext) {
    try {
      logger.info(`[CARDAPIO_PRODUTOS IMAGE] Product ID: ${params.id}`)

      const produto = await CardapioProduto.query()
        .where('id', params.id)
        .select('image_url')
        .firstOrFail()

      // Se houver URL da CDN, redirecionar
      if (produto.imageUrl) {
        response.header('Cache-Control', 'public, max-age=31536000')
        return response.redirect(produto.imageUrl)
      }

      return response.notFound({ message: 'Imagem não encontrada' })
    } catch (error) {
      logger.error(
        `[CARDAPIO_PRODUTOS IMAGE] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      return response.notFound({ message: 'Produto não encontrado' })
    }
  }

  /**
   * Remove um ingrediente do produto
   */
  async removeIngredient({ params, response, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const produtoId = params.itemId
    const ingredientId = params.ingredientId

    logger.info(
      `[CARDAPIO_PRODUTOS REMOVE_INGREDIENT] User: ${user.id} | Product ID: ${produtoId} | Ingredient ID: ${ingredientId}`
    )

    try {
      // Verificar se o produto pertence à empresa do usuário
      const produto = await CardapioProduto.query()
        .where('id', produtoId)
        .where('empresa_id', user.empresaId)
        .first()

      if (!produto) {
        return response.notFound({ message: 'Produto não encontrado' })
      }

      // Remover o ingrediente
      const ingredient = await CardapioProdutoIngrediente.query()
        .where('id', ingredientId)
        .where('cardapio_produto_id', produtoId)
        .first()

      if (!ingredient) {
        return response.notFound({ message: 'Ingrediente não encontrado' })
      }

      await ingredient.delete()

      // Recalcular custo
      const ingredientsCost = await this.recalculateCost(produto)
      const enforcedCost = Math.max(produto.costPrice || 0, ingredientsCost)
      await CardapioProduto.query().where('id', produto.id).update({ costPrice: enforcedCost })
      produto.costPrice = enforcedCost

      // Atualizar preço de venda automático
      await produto.updateMarkupPrice()

      logger.info(
        `[CARDAPIO_PRODUTOS REMOVE_INGREDIENT] Success - Ingredient ${ingredientId} removed from Product ${produtoId}`
      )
      return response.json({ success: true })
    } catch (error) {
      logger.error(
        `[CARDAPIO_PRODUTOS REMOVE_INGREDIENT] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      return response.internalServerError({ message: 'Erro ao remover ingrediente' })
    }
  }

  /**
   * Recalcula o custo baseado nos ingredientes
   */
  private async recalculateCost(produto: CardapioProduto) {
    const ingredients = await CardapioProdutoIngrediente.query()
      .where('cardapio_produto_id', produto.id)
      .preload('insumo')

    let totalCost = 0
    for (const ingredient of ingredients) {
      const insumo = ingredient.insumo
      if (insumo && ingredient.quantity) {
        // Atualizar unitCost e totalCost do ingrediente com base no preço atual do insumo
        const unitCost = insumo.purchasePrice || 0
        const itemTotalCost = unitCost * ingredient.quantity

        // Atualizar o ingrediente no banco
        await CardapioProdutoIngrediente.query().where('id', ingredient.id).update({
          unitCost: unitCost,
          totalCost: itemTotalCost,
        })

        totalCost += itemTotalCost
      }
    }

    // Atualizar o custo do produto diretamente no banco
    await CardapioProduto.query().where('id', produto.id).update({ costPrice: totalCost })
    produto.costPrice = totalCost
    return totalCost
  }
}
