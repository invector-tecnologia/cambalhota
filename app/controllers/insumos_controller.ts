import type { HttpContext } from '@adonisjs/core/http'
import Insumo from '#models/insumo'
import Fornecedor from '#models/fornecedor'
import vine from '@vinejs/vine'
import { parseBRToNumber } from '../helpers/number_formatter.js'
import Database from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import cloudLogger from '#services/cloud_logger'

export default class InsumosController {
  /**
   * Lista todos os insumos
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const page = request.input('page', 1)
    const search = request.input('search', '')
    const type = request.input('type', '')
    const category = request.input('category', '')
    const stockStatus = request.input('stock_status', '')

    let query = Insumo.query().preload('empresa').preload('fornecedorPadrao')

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('code', 'ilike', `%${search}%`)
          .orWhere('barcode', 'ilike', `%${search}%`)
      })
    }

    if (type) {
      query = query.where('type', type)
    }

    if (category) {
      query = query.where('category', 'ilike', `%${category}%`)
    }

    if (stockStatus === 'low') {
      query = query.whereRaw('current_stock <= minimum_stock')
    } else if (stockStatus === 'high') {
      query = query.whereRaw('current_stock >= maximum_stock')
    }

    const insumos = await query
      .where('empresa_id', user.empresaId)
      .orderBy('name', 'asc')
      .paginate(page, 15)

    // Buscar categorias para filtro
    const categories = await Insumo.query()
      .select('category')
      .where('empresa_id', user.empresaId)
      .whereNotNull('category')
      .groupBy('category')
      .orderBy('category')

    return view.render('almoxarifado/insumos/index', {
      insumos: insumos.serialize(),
      categories: categories.map((c) => c.category),
      filters: { search, type, category, stockStatus },
    })
  }

  /**
   * Formulário de criação
   */
  async create({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    // Buscar fornecedores ativos para o select
    const fornecedores = await Fornecedor.query()
      .where('active', true)
      .where('empresa_id', user.empresaId)
      .orderBy('name')

    return view.render('almoxarifado/insumos/create', { fornecedores })
  }

  /**
   * Processa criação do produto
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    logger.info(`[INSUMOS STORE] Starting insumo creation`)
    const createSchema = vine.object({
      code: vine.string().optional(),
      barcode: vine.string().optional(),
      name: vine.string().minLength(2).maxLength(255),
      description: vine.string().optional(),
      type: vine.enum(['ingredient', 'finished_product', 'beverage', 'supply']),
      category: vine.string().optional(),
      subcategory: vine.string().optional(),
      unit: vine.string().minLength(1),
      purchase_unit: vine.string().optional(),
      conversion_factor: vine
        .string()
        .transform((value) => (value && value.trim() !== '' ? parseBRToNumber(value) : 1)),
      purchase_price: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      cost_price: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      sale_price: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      current_stock: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      minimum_stock: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      maximum_stock: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      stock_control: vine.string().optional(),
      ncm: vine.string().optional(),
      cest: vine.string().optional(),
      tax_rate: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      fornecedor_padrao_id: vine.number().optional(),
      perishable: vine.string().optional(),
      shelf_life_days: vine
        .string()
        .optional()
        .transform((value) => (value && value.trim() !== '' ? Number.parseInt(value) : null)),
      active: vine.string().optional(),
    })

    try {
      const data = await vine.validate({
        schema: createSchema,
        data: request.all(),
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const insumo = await Insumo.create({
        code: data.code,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        unit: data.unit,
        purchaseUnit: data.purchase_unit,
        conversionFactor: data.conversion_factor ?? 1,
        purchasePrice: data.purchase_price,
        costPrice: data.cost_price,
        salePrice: data.sale_price,
        currentStock: data.current_stock ?? 0,
        minimumStock: data.minimum_stock ?? 0,
        maximumStock: data.maximum_stock,
        stockControl: Boolean(data.stock_control),
        ncm: data.ncm,
        cest: data.cest,
        taxRate: data.tax_rate ?? 0,
        fornecedorPadraoId: data.fornecedor_padrao_id,
        perishable: Boolean(data.perishable),
        shelfLifeDays: data.shelf_life_days,
        active: Boolean(data.active),
        empresaId: user.empresaId,
        createdBy: user.id,
      })

      cloudLogger.info('INSUMO_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        insumoId: insumo.id,
        insumoName: insumo.name,
      })

      session.flash('success', 'Produto cadastrado com sucesso!')
      return response.redirect().toRoute('insumos.show', { id: insumo.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('INSUMO_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao cadastrar produto')
      return response.redirect().back()
    }
  }

  /**
   * Exibe detalhes do produto
   */
  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const insumo = await Insumo.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()
    await insumo.load('empresa')
    await insumo.load('fornecedorPadrao')

    // Buscar utilização do insumo nos últimos 30 dias
    const db = await Database.from('cardapio_produtos_ingredientes as cpi')
      .join('cardapio_produtos as cp', 'cpi.cardapio_produto_id', 'cp.id')
      .join('venda_itens as vi', 'vi.cardapio_produto_id', 'cp.id')
      .join('vendas as v', 'vi.venda_id', 'v.id')
      .where('cpi.insumo_id', params.id)
      .where('v.empresa_id', user.empresaId)
      .where('v.created_at', '>=', DateTime.now().minus({ days: 30 }).toSQL())
      .select('cp.name as produto_nome', 'cpi.quantity as quantidade_receita')
      .sum('vi.quantity as total_vendido')
      .groupBy('cp.id', 'cp.name', 'cpi.quantity')
      .orderBy('total_vendido', 'desc')
      .limit(10)

    const utilizacao = db.map((item: any) => ({
      produtoNome: item.produto_nome,
      quantidadeReceita: Number(item.quantidade_receita),
      totalVendido: Number(item.total_vendido),
      insumoUtilizado: Number(item.quantidade_receita) * Number(item.total_vendido),
    }))

    const totalUtilizado = utilizacao.reduce((sum, item) => sum + item.insumoUtilizado, 0)

    return view.render('almoxarifado/insumos/show', {
      insumo,
      utilizacao,
      totalUtilizado,
    })
  }

  /**
   * Formulário de edição
   */
  async edit({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const insumo = await Insumo.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()
    await insumo.load('empresa')
    // Buscar fornecedores ativos para o select
    const fornecedores = await Fornecedor.query()
      .where('active', true)
      .where('empresa_id', user.empresaId)
      .orderBy('name')

    return view.render('almoxarifado/insumos/edit', { insumo, fornecedores })
  }

  /**
   * Processa atualização do produto
   */
  async update({ params, request, response, session, auth }: HttpContext) {
    const updateSchema = vine.object({
      code: vine.string().optional(),
      barcode: vine.string().optional(),
      name: vine.string().minLength(2).maxLength(255),
      description: vine.string().optional(),
      type: vine.enum(['ingredient', 'finished_product', 'beverage', 'supply']),
      category: vine.string().optional(),
      subcategory: vine.string().optional(),
      unit: vine.string().minLength(1),
      purchase_unit: vine.string().optional(),
      conversion_factor: vine
        .string()
        .transform((value) => (value && value.trim() !== '' ? parseBRToNumber(value) : 1)),
      purchase_price: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      cost_price: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      sale_price: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      current_stock: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      minimum_stock: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      maximum_stock: vine
        .string()
        .optional()
        .transform((value) => parseBRToNumber(value)),
      stock_control: vine.string().optional(),
      ncm: vine.string().optional(),
      cest: vine.string().optional(),
      tax_rate: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      fornecedor_padrao_id: vine.number().optional(),
      perishable: vine.string().optional(),
      shelf_life_days: vine
        .string()
        .optional()
        .transform((value) => (value && value.trim() !== '' ? Number.parseInt(value) : null)),
      active: vine.string().optional(),
    })

    try {
      const data = await vine.validate({
        schema: updateSchema,
        data: request.all(),
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const insumo = await Insumo.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      insumo.merge({
        code: data.code,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        unit: data.unit,
        purchaseUnit: data.purchase_unit,
        conversionFactor: data.conversion_factor ?? insumo.conversionFactor,
        purchasePrice: data.purchase_price,
        costPrice: data.cost_price,
        salePrice: data.sale_price,
        currentStock: data.current_stock,
        minimumStock: data.minimum_stock,
        maximumStock: data.maximum_stock,
        stockControl: Boolean(data.stock_control),
        ncm: data.ncm,
        cest: data.cest,
        taxRate: data.tax_rate ?? insumo.taxRate,
        fornecedorPadraoId: data.fornecedor_padrao_id,
        perishable: Boolean(data.perishable),
        shelfLifeDays: data.shelf_life_days,
        active: Boolean(data.active),
        updatedBy: user.id,
      })

      await insumo.save()

      cloudLogger.info('INSUMO_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        insumoId: insumo.id,
        insumoName: insumo.name,
      })

      session.flash('success', 'Produto atualizado com sucesso!')
      return response.redirect().toRoute('insumos.show', { id: insumo.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('INSUMO_UPDATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao atualizar produto')
      return response.redirect().back()
    }
  }

  /**
   * Remove o produto
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')

      const insumo = await Insumo.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      // Soft delete - apenas marca como inativo
      const insumoId = insumo.id
      const insumoName = insumo.name
      insumo.active = false
      await insumo.save()

      cloudLogger.info('INSUMO_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        insumoId: insumoId,
        insumoName: insumoName,
      })

      session.flash('success', 'Produto removido com sucesso!')
      return response.redirect().toRoute('insumos.index')
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('INSUMO_DELETE_FAILED', {
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
   * Atualizar estoque do produto
   */
  async updateStock({ params, request, response, session, auth, logger }: HttpContext) {
    const stockSchema = vine.object({
      quantity: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
      operation: vine.enum(['add', 'subtract']),
      reason: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: stockSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const insumo = await Insumo.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      logger.info(`updateStock - Insumo ID: ${insumo.id}, Nome: ${insumo.name}`)
      logger.info(
        `updateStock - Estoque antes: ${insumo.currentStock} (tipo: ${typeof insumo.currentStock})`
      )
      logger.info(
        `updateStock - Quantidade a operar: ${data.quantity} (tipo: ${typeof data.quantity})`
      )

      const estoqueAtual = Number(insumo.currentStock) || 0
      const quantidade = Number(data.quantity) || 0

      let novoEstoque: number
      if (data.operation === 'add') {
        novoEstoque = estoqueAtual + quantidade
      } else {
        novoEstoque = Math.max(0, estoqueAtual - quantidade)
      }

      logger.info(`updateStock - Novo estoque calculado: ${novoEstoque}`)

      insumo.currentStock = novoEstoque

      logger.info(
        `updateStock - Antes de salvar - isDirty: ${insumo.$isDirty}, dirty fields: ${JSON.stringify(insumo.$dirty)}`
      )

      await insumo.save()

      logger.info(`updateStock - Salvo com sucesso! Estoque final: ${insumo.currentStock}`)

      session.flash('success', 'Estoque atualizado com sucesso!')
      return response.redirect().toRoute('insumos.show', { id: insumo.id })
    } catch (error) {
      logger.error(
        `updateStock - Erro completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      session.flash('error', `Erro ao atualizar estoque: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * API: Lista produtos para autocomplete/select
   */
  async api({ request, response, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const search = request.input('search', '')
    const type = request.input('type', '')

    let query = Insumo.query().where('active', true).where('empresa_id', user.empresaId)

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    if (type) {
      query = query.where('type', type)
    }

    const products = await query
      .select('id', 'name', 'code', 'unit', 'currentStock', 'purchasePrice')
      .orderBy('name', 'asc')
      .limit(10)

    return response.json(products)
  }
}
