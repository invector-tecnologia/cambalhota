import type { HttpContext } from '@adonisjs/core/http'
import Funcionario from '#models/funcionario'
import Funcao from '#models/funcao'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import cloudLogger from '#services/cloud_logger'

export default class FuncionariosController {
  /**
   * Lista todos os funcionários
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const active = request.input('active', '')

    let query = Funcionario.query().where('empresa_id', user.empresaId).preload('funcoes')

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${search}%`)
          .orWhere('cpf', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
      })
    }

    if (active !== '') {
      query = query.where('active', active === 'true')
    }

    const funcionarios = await query.orderBy('name', 'asc').paginate(page, 20)

    return view.render('funcionarios/index', {
      funcionarios: funcionarios.serialize(),
      filters: { search, active },
    })
  }

  /**
   * Exibe formulário para criar novo funcionário
   */
  async create({ view, auth }: HttpContext) {
    await auth.authenticate()

    const funcoes = await Funcao.query().orderBy('name', 'asc')

    return view.render('funcionarios/create', {
      funcoes: funcoes.map((f) => f.serialize()),
    })
  }

  /**
   * Armazena novo funcionário
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    try {
      const validator = vine.compile(
        vine.object({
          name: vine.string().minLength(3).maxLength(100),
          cpf: vine.string().optional(),
          email: vine.string().email().optional(),
          phone: vine.string().optional(),
          hireDate: vine.date().nullable().optional(),
          active: vine.boolean().optional(),
          notes: vine.string().optional(),
          funcoes: vine.array(vine.number()).minLength(1),
        })
      )

      const data = await request.validateUsing(validator)

      const funcionario = await Funcionario.create({
        empresaId: user.empresaId,
        name: data.name,
        cpf: data.cpf,
        email: data.email,
        phone: data.phone,
        hireDate: data.hireDate ? DateTime.fromJSDate(data.hireDate) : null,
        active: data.active ?? true,
        notes: data.notes,
      })

      // Associar funções
      await funcionario.related('funcoes').attach(data.funcoes)

      cloudLogger.info('FUNCIONARIO_CREATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        funcionarioId: funcionario.id,
        funcionarioName: funcionario.name,
      })

      session.flash('success', 'Funcionário criado com sucesso!')
      return response.redirect().toRoute('funcionarios.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      cloudLogger.error('FUNCIONARIO_CREATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao criar funcionário')
      return response.redirect().back()
    }
  }

  /**
   * Exibe um funcionário específico
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const funcionario = await Funcionario.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('funcoes')
      .first()

    if (!funcionario) {
      return response.notFound('Funcionário não encontrado')
    }

    return view.render('funcionarios/show', {
      funcionario: funcionario.serialize(),
    })
  }

  /**
   * Exibe formulário para editar funcionário
   */
  async edit({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const funcionario = await Funcionario.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('funcoes')
      .first()

    if (!funcionario) {
      return response.notFound('Funcionário não encontrado')
    }

    const funcoes = await Funcao.query().orderBy('name', 'asc')

    const funcionarioData = funcionario.serialize()
    // @ts-ignore
    funcionarioData.funcoesIds = funcionario.funcoes.map((f) => f.id)

    return view.render('funcionarios/edit', {
      funcionario: funcionarioData,
      funcoes: funcoes.map((f) => f.serialize()),
    })
  }

  /**
   * Atualiza funcionário
   */
  async update({ request, response, params, session, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    try {
      const funcionario = await Funcionario.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .first()

      if (!funcionario) {
        return response.notFound('Funcionário não encontrado')
      }

      const validator = vine.compile(
        vine.object({
          name: vine.string().minLength(3).maxLength(100),
          cpf: vine.string().optional(),
          email: vine.string().email().optional(),
          phone: vine.string().optional(),
          hireDate: vine.date().nullable().optional(),
          active: vine.boolean().optional(),
          notes: vine.string().optional(),
          funcoes: vine.array(vine.number()).minLength(1),
        })
      )

      const data = await request.validateUsing(validator)

      funcionario.merge({
        name: data.name,
        cpf: data.cpf,
        email: data.email,
        phone: data.phone,
        hireDate: data.hireDate ? DateTime.fromJSDate(data.hireDate) : null,
        active: data.active ?? true,
        notes: data.notes,
      })

      await funcionario.save()

      // Sincronizar funções
      await funcionario.related('funcoes').sync(data.funcoes)

      cloudLogger.info('FUNCIONARIO_UPDATED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        funcionarioId: funcionario.id,
        funcionarioName: funcionario.name,
      })

      session.flash('success', 'Funcionário atualizado com sucesso!')
      return response.redirect().toRoute('funcionarios.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      cloudLogger.error('FUNCIONARIO_UPDATE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao atualizar funcionário')
      return response.redirect().back()
    }
  }

  /**
   * Remove funcionário
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    try {
      const funcionario = await Funcionario.query()
        .where('id', params.id)
        .where('empresa_id', user.empresaId)
        .first()

      if (!funcionario) {
        return response.notFound('Funcionário não encontrado')
      }

      const funcionarioId = funcionario.id
      const funcionarioName = funcionario.name
      await funcionario.delete()

      cloudLogger.info('FUNCIONARIO_DELETED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa?.cnpj,
        funcionarioId: funcionarioId,
        funcionarioName: funcionarioName,
      })

      session.flash('success', 'Funcionário removido com sucesso!')
      return response.redirect().toRoute('funcionarios.index')
    } catch (error) {
      const errorUser = await auth.authenticate()
      await errorUser.load('empresa')
      cloudLogger.error('FUNCIONARIO_DELETE_FAILED', {
        userId: errorUser.id,
        empresaId: errorUser.empresaId,
        cnpj: errorUser.empresa?.cnpj,
        error: error.message || String(error),
      })
      session.flash('error', 'Erro ao remover funcionário')
      return response.redirect().back()
    }
  }
}
