import type { HttpContext } from '@adonisjs/core/http'
import Fornecedor from '#models/fornecedor'
import vine from '@vinejs/vine'
import cloudLogger from '#services/cloud_logger'

export default class FornecedoresController {
  /**
   * Lista todos os fornecedores
   */
  async index({ view, request, auth }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const user = await auth.authenticate()
    await user.load('empresa')

    let query = Fornecedor.query().preload('empresa')

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('contact_person', 'ilike', `%${search}%`)
          .orWhere('document', 'ilike', `%${search}%`)
      })
    }

    const fornecedores = await query
      .where('empresa_id', user.empresaId)
      .orderBy('name', 'asc')
      .paginate(page, 15)

    return view.render('almoxarifado/fornecedores/index', {
      fornecedores: fornecedores.serialize(),
      search,
    })
  }

  /**
   * Formulário de criação
   */
  async create({ view }: HttpContext) {
    // const user = await auth.authenticate()
    return view.render('almoxarifado/fornecedores/create')
  }

  /**
   * Processa criação do fornecedor
   */
  async store({ request, response, session, auth, logger }: HttpContext) {
    const createSchema = vine.object({
      name: vine.string().minLength(2).maxLength(255),
      trade_name: vine.string().optional(),
      document: vine.string().minLength(11),
      document_type: vine.enum(['cpf', 'cnpj']),
      ie: vine.string().optional(),
      address: vine.string().optional(),
      address_number: vine.string().optional(),
      address_complement: vine.string().optional(),
      neighborhood: vine.string().optional(),
      city: vine.string().optional(),
      state: vine.string().optional(),
      zip_code: vine.string().optional(),
      phone: vine.string().optional(),
      email: vine.string().email().optional(),
      contact_person: vine.string().optional(),
      notes: vine.string().optional(),
      payment_terms: vine.enum(['vista', '7d', '15d', '30d', '45d', '60d']),
      active: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: createSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const fornecedor = await Fornecedor.create({
        name: data.name,
        tradeName: data.trade_name,
        document: data.document,
        documentType: data.document_type,
        ie: data.ie,
        address: data.address,
        addressNumber: data.address_number,
        addressComplement: data.address_complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        email: data.email,
        contactPerson: data.contact_person,
        notes: data.notes,
        paymentTerms: data.payment_terms,
        active: Boolean(data.active),
        empresaId: user.empresaId,
        createdBy: user.id,
      })

      logger.info(
        `[FORNECEDORES STORE] SUCCESS | Fornecedor ID: ${fornecedor.id} | Name: ${fornecedor.name} | User: ${user.id}`
      )
      cloudLogger.info('FORNECEDOR_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        fornecedorId: fornecedor.id,
        fornecedorName: fornecedor.name,
      })

      session.flash('success', 'Fornecedor cadastrado com sucesso!')
      return response.redirect().toRoute('fornecedores.show', { id: fornecedor.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[STORE FORNECEDOR] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('FORNECEDOR_CREATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [STORE FORNECEDOR] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      console.log('Erro ao cadastrar fornecedor:', error)
      session.flash('error', 'Erro ao cadastrar fornecedor')
      return response.redirect().back()
    }
  }

  /**
   * Exibe detalhes do fornecedor
   */
  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const fornecedor = await Fornecedor.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()
    await fornecedor.load('empresa')

    return view.render('almoxarifado/fornecedores/show', { fornecedor })
  }

  /**
   * Formulário de edição
   */
  async edit({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const fornecedor = await Fornecedor.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .firstOrFail()
    await fornecedor.load('empresa')

    return view.render('almoxarifado/fornecedores/edit', { fornecedor })
  }

  /**
   * Processa atualização do fornecedor
   */
  async update({ params, request, response, session, auth, logger }: HttpContext) {
    const updateSchema = vine.object({
      name: vine.string().minLength(2).maxLength(255),
      trade_name: vine.string().optional(),
      document: vine.string().minLength(11),
      document_type: vine.enum(['cpf', 'cnpj']),
      ie: vine.string().optional(),
      address: vine.string().optional(),
      address_number: vine.string().optional(),
      address_complement: vine.string().optional(),
      neighborhood: vine.string().optional(),
      city: vine.string().optional(),
      state: vine.string().optional(),
      zip_code: vine.string().optional(),
      phone: vine.string().optional(),
      email: vine.string().email().optional(),
      contact_person: vine.string().optional(),
      notes: vine.string().optional(),
      payment_terms: vine.enum(['vista', '7d', '15d', '30d', '45d', '60d']),
      active: vine.string().optional(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: updateSchema,
        data: rawData,
      })

      const user = await auth.authenticate()
      await user.load('empresa')

      const fornecedor = await Fornecedor.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      fornecedor.merge({
        name: data.name,
        tradeName: data.trade_name,
        document: data.document,
        documentType: data.document_type,
        ie: data.ie,
        address: data.address,
        addressNumber: data.address_number,
        addressComplement: data.address_complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        email: data.email,
        contactPerson: data.contact_person,
        notes: data.notes,
        paymentTerms: data.payment_terms,
        active: Boolean(data.active),
        updatedBy: user.id,
      })

      await fornecedor.save()

      cloudLogger.info('FORNECEDOR_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        fornecedorId: fornecedor.id,
        fornecedorName: fornecedor.name,
      })

      session.flash('success', 'Fornecedor atualizado com sucesso!')

      return response.redirect().toRoute('fornecedores.show', { id: fornecedor.id })
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      logger.error(
        `[UPDATE FORNECEDOR] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      cloudLogger.error('FORNECEDOR_UPDATE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        console.log(
          '📋 [UPDATE FORNECEDOR] Erros de validação:',
          JSON.stringify(error.messages, null, 2)
        )
        session.flash('errors', error.messages)
      }

      console.log('Erro ao atualizar fornecedor:', error)
      session.flash('error', 'Erro ao atualizar fornecedor')
      return response.redirect().back()
    }
  }

  /**
   * Remove o fornecedor
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await user.load('empresa')

      const fornecedor = await Fornecedor.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .firstOrFail()

      // Soft delete - apenas marca como inativo
      const fornecedorId = fornecedor.id
      const fornecedorName = fornecedor.name
      fornecedor.active = false
      await fornecedor.save()

      cloudLogger.info('FORNECEDOR_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        fornecedorId: fornecedorId,
        fornecedorName: fornecedorName,
      })

      session.flash('success', 'Fornecedor removido com sucesso!')
      return response.redirect().toRoute('fornecedores.index')
    } catch (error) {
      const user = await auth.authenticate()
      await user.load('empresa')
      cloudLogger.error('FORNECEDOR_DELETE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao remover fornecedor')
      return response.redirect().back()
    }
  }

  /**
   * API: Lista fornecedores para autocomplete/select
   */
  async api({ request, response, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const search = request.input('search', '')

    let query = Fornecedor.query().where('active', true).where('empresa_id', user.empresaId)

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`)
    }

    const fornecedores = await query
      .select('id', 'name', 'contact_person', 'document')
      .orderBy('name', 'asc')
      .limit(10)

    return response.json(fornecedores)
  }
}
