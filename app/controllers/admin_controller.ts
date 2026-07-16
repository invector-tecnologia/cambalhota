import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { extractCount } from '#helpers/db_agg'
import User from '#models/user'
import Empresa from '#models/empresa'
import Supplier from '#models/fornecedor'
import Insumo from '#models/insumo'
import Nfe from '#models/nfe'
import CardapioCategoria from '#models/cardapio_categoria'
import CardapioProduto from '#models/cardapio_produto'
import Comanda from '#models/comanda'
import Pedido from '#models/pedido'
import PedidoItem from '#models/pedido_item'
import Venda from '#models/venda'
import VendaItem from '#models/venda_item'
import CaixaRegistro from '#models/caixa_registro'
import Mesa from '#models/mesa'
import FiscalNote from '#models/fiscal_note'
import FiscalConfig from '#models/fiscal_config'
import AssinaturaEmpresa from '#models/assinatura_empresa'
import SuporteSolicitacao from '#models/suporte_solicitacao'
import EmpresaDeletionService from '#services/empresa_deletion_service'
import vine from '@vinejs/vine'
import string from '@adonisjs/core/helpers/string'

export default class AdminController {
  /**
   * Dashboard admin
   */
  async index({ view }: HttpContext) {
    const hoje = DateTime.now().startOf('day')
    const hojeIso = hoje.toISODate()
    const proximaSemanaIso = hoje.plus({ days: 7 }).toISODate()
    const ultimos30Dias = DateTime.now().minus({ days: 30 }).toJSDate()

    const [
      totalUsers,
      totalEmpresas,
      totalFornecedores,
      totalInsumos,
      totalProdutos,
      totalVendas,
      totalPaidPedidos,
      totalFiscalNotes,
      totalFiscalConfigs,
      totalAssinaturas,
      assinaturasAtivas,
      assinaturasVencendo,
      assinaturasInadimplentes,
      novasEmpresas30Dias,
      totalSuportes,
      suportesAbertos,
      suportesUrgentes,
      empresasRecentes,
      assinaturasEmAtencao,
      suportesRecentes,
    ] = await Promise.all([
      User.query().count('* as total'),
      Empresa.query().count('* as total'),
      Supplier.query().count('* as total'),
      Insumo.query().count('* as total'),
      CardapioProduto.query().count('* as total'),
      Venda.query().count('* as total'),
      Pedido.query().where('status', 'paid').count('* as total'),
      FiscalNote.query().count('* as total'),
      FiscalConfig.query().count('* as total'),
      AssinaturaEmpresa.query().count('* as total'),
      AssinaturaEmpresa.query().where('status', 'active').count('* as total'),
      AssinaturaEmpresa.query()
        .whereIn('status', ['active', 'trial'])
        .whereNotNull('proximo_vencimento')
        .whereBetween('proximo_vencimento', [hojeIso!, proximaSemanaIso!])
        .count('* as total'),
      AssinaturaEmpresa.query()
        .where((builder) => {
          builder.where('status', 'past_due').orWhere((inner) => {
            inner
              .whereIn('status', ['active', 'trial'])
              .whereNotNull('proximo_vencimento')
              .where('proximo_vencimento', '<', hojeIso!)
          })
        })
        .count('* as total'),
      Empresa.query().where('created_at', '>=', ultimos30Dias).count('* as total'),
      SuporteSolicitacao.query().count('* as total'),
      SuporteSolicitacao.query()
        .whereIn('status', [
          'aberto',
          'em_andamento',
          'aguardando_usuario',
          'aguardando_admin',
          'sugestao_solucao',
        ])
        .count('* as total'),
      SuporteSolicitacao.query()
        .where('prioridade', 'urgente')
        .whereNotIn('status', ['resolvido', 'fechado'])
        .count('* as total'),
      Empresa.query().orderBy('created_at', 'desc').limit(8),
      AssinaturaEmpresa.query()
        .preload('empresa')
        .where((builder) => {
          builder.where('status', 'past_due').orWhere((inner) => {
            inner
              .whereIn('status', ['active', 'trial'])
              .whereNotNull('proximo_vencimento')
              .whereBetween('proximo_vencimento', [hojeIso!, proximaSemanaIso!])
          })
        })
        .orderBy('proximo_vencimento', 'asc')
        .limit(8),
      SuporteSolicitacao.query().preload('empresa').orderBy('created_at', 'desc').limit(8),
    ])

    const vendasCount = extractCount(totalVendas)

    const paidPedidosCount = extractCount(totalPaidPedidos)

    return view.render('admin/index', {
      stats: {
        users: totalUsers[0].$extras.total,
        empresas: totalEmpresas[0].$extras.total,
        fornecedores: totalFornecedores[0].$extras.total,
        insumos: totalInsumos[0].$extras.total,
        produtos: totalProdutos[0].$extras.total,
        vendas: Number(vendasCount || paidPedidosCount),
        fiscalNotes: totalFiscalNotes[0].$extras.total,
        fiscalConfigs: totalFiscalConfigs[0].$extras.total,
        assinaturas: totalAssinaturas[0].$extras.total,
        assinaturasAtivas: assinaturasAtivas[0].$extras.total,
        assinaturasVencendo: assinaturasVencendo[0].$extras.total,
        assinaturasInadimplentes: assinaturasInadimplentes[0].$extras.total,
        novasEmpresas30Dias: novasEmpresas30Dias[0].$extras.total,
        suportes: totalSuportes[0].$extras.total,
        suportesAbertos: suportesAbertos[0].$extras.total,
        suportesUrgentes: suportesUrgentes[0].$extras.total,
      },
      empresasRecentes: empresasRecentes.map((empresa) => empresa.serialize()),
      assinaturasEmAtencao: assinaturasEmAtencao.map((assinatura) => assinatura.serialize()),
      suportesRecentes: suportesRecentes.map((suporte) => suporte.serialize()),
    })
  }

  /**
   * Lista registros de um modelo
   */
  async list({ view, params, request }: HttpContext) {
    const { model } = params
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const empresaId = request.input('empresaId', '')
    const canal = request.input('canal', '')

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return view.render('errors/not_found')
    }

    let query = Model.query()

    // Preload relacionamentos comuns
    if (model === 'users') {
      query.preload('empresa')
    } else if (model === 'insumos') {
      query.preload('empresa').preload('fornecedorPadrao')
    } else if (model === 'cardapio_produtos') {
      query.preload('cardapioCategoria').preload('empresa')
    } else if (model === 'pedidos') {
      query.preload('comanda').preload('empresa')
    } else if (model === 'vendas') {
      query.preload('empresa').preload('user').preload('comanda').preload('pedido')
    } else if (model === 'assinaturas_empresas') {
      query.preload('empresa')
    } else if (model === 'suporte_solicitacoes') {
      query.preload('empresa')
    }

    // Busca simples
    if (search) {
      if (model === 'users') {
        query.where('name', 'ilike', `%${search}%`).orWhere('email', 'ilike', `%${search}%`)
      } else if (model === 'empresas') {
        query
          .where('razao_social', 'ilike', `%${search}%`)
          .orWhere('trade_name', 'ilike', `%${search}%`)
          .orWhere('cnpj', 'ilike', `%${search}%`)
      } else if (model === 'fornecedores') {
        query.where('name', 'ilike', `%${search}%`)
      } else if (model === 'assinaturas_empresas') {
        query
          .where('plano', 'ilike', `%${search}%`)
          .orWhere('status', 'ilike', `%${search}%`)
          .orWhere('gateway_ref', 'ilike', `%${search}%`)
      } else if (model === 'suporte_solicitacoes') {
        query
          .where('assunto', 'ilike', `%${search}%`)
          .orWhere('nome_contato', 'ilike', `%${search}%`)
          .orWhere('email_contato', 'ilike', `%${search}%`)
      }
    }

    // Filtro por empresa
    const modelsWithEmpresa = [
      'users',
      'fornecedores',
      'insumos',
      'cardapio_categorias',
      'cardapio_produtos',
      'comandas',
      'pedidos',
      'vendas',
      'caixa_registros',
      'mesas',
      'notas_fiscais',
      'assinaturas_empresas',
      'suporte_solicitacoes',
    ]
    if (empresaId && modelsWithEmpresa.includes(model)) {
      query.where('empresa_id', empresaId)
    }

    if (model === 'suporte_solicitacoes' && canal) {
      query.where('canal', canal)
    }

    const records = await query.orderBy('id', 'desc').paginate(page, 50)
    const empresas = await Empresa.query().orderBy('razao_social', 'asc')

    return view.render('admin/list', {
      model,
      modelName: this.getModelName(model),
      records: records.serialize(),
      search,
      empresaId,
      canal,
      empresas,
    })
  }

  /**
   * Exibe formulário de criação
   */
  async create({ view, params }: HttpContext) {
    const { model } = params
    return view.render('admin/create', {
      model,
      modelName: this.getModelName(model),
    })
  }

  /**
   * Armazena novo registro
   */
  async store({ params, request, response, session }: HttpContext) {
    const { model } = params
    const dataInput = request.input('data')

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return response.notFound({ error: 'Modelo não encontrado' })
    }

    try {
      const data = this.parseDataInput(dataInput)
      await Model.create(data)
      session.flash('success', 'Registro criado com sucesso!')
      return response.redirect().toRoute('admin.list', { model })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      session.flash('error', `Erro ao criar registro: ${errorMessage}`)
      return response.redirect().back()
    }
  }

  /**
   * Exibe formulário de edição
   */
  async edit({ view, params, response }: HttpContext) {
    const { model, id } = params

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return response.notFound({ error: 'Modelo não encontrado' })
    }

    const record = await Model.find(id)
    if (!record) {
      return response.notFound({ error: 'Registro não encontrado' })
    }

    return view.render('admin/edit', {
      model,
      modelName: this.getModelName(model),
      record: record.serialize(),
    })
  }

  /**
   * Exibe detalhes de um registro
   */
  async show({ view, params, response }: HttpContext) {
    const { model, id } = params

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return response.notFound({ error: 'Modelo não encontrado' })
    }

    let query = Model.query().where('id', id)

    // Preload relacionamentos comuns
    if (model === 'users') {
      query.preload('empresa').preload('role')
    } else if (model === 'insumos') {
      query.preload('empresa').preload('fornecedorPadrao')
    } else if (model === 'cardapio_produtos') {
      query.preload('cardapioCategoria').preload('empresa')
    } else if (model === 'pedidos') {
      query.preload('comanda').preload('empresa').preload('items')
    } else if (model === 'vendas') {
      query.preload('empresa').preload('user').preload('comanda').preload('pedido').preload('items')
    } else if (model === 'assinaturas_empresas') {
      query.preload('empresa')
    } else if (model === 'suporte_solicitacoes') {
      query.preload('empresa')
    }

    const record = await query.first()
    if (!record) {
      return response.notFound({ error: 'Registro não encontrado' })
    }

    return view.render('admin/show', {
      model,
      modelName: this.getModelName(model),
      record: record.serialize(),
    })
  }

  /**
   * Atualiza registro
   */
  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const { model, id } = params

    // Check if this is actually a DELETE request via method spoofing
    if (request.input('_method') === 'DELETE') {
      return this.destroy(ctx)
    }

    const dataInput = request.input('data')
    const { response, session } = ctx

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return response.notFound({ error: 'Modelo não encontrado' })
    }

    const record = await Model.find(id)
    if (!record) {
      return response.notFound({ error: 'Registro não encontrado' })
    }

    try {
      const data = this.parseDataInput(dataInput)
      record.merge(data)
      await record.save()
      session.flash('success', 'Registro atualizado com sucesso!')
      return response.redirect().toRoute('admin.list', { model })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      session.flash('error', `Erro ao atualizar registro: ${errorMessage}`)
      return response.redirect().back()
    }
  }

  /**
   * Deleta registro
   */
  async destroy({ params, response, session, request }: HttpContext) {
    const { model, id } = params

    const empresaDeletionService = new EmpresaDeletionService()

    const models: Record<string, any> = {
      users: User,
      empresas: Empresa,
      fornecedores: Supplier,
      insumos: Insumo,
      notas_fiscais: Nfe,
      cardapio_categorias: CardapioCategoria,
      cardapio_produtos: CardapioProduto,
      comandas: Comanda,
      pedidos: Pedido,
      pedido_items: PedidoItem,
      vendas: Venda,
      venda_items: VendaItem,
      caixa_registros: CaixaRegistro,
      mesas: Mesa,
      fiscal_notes: FiscalNote,
      fiscal_configs: FiscalConfig,
      assinaturas_empresas: AssinaturaEmpresa,
      suporte_solicitacoes: SuporteSolicitacao,
    }

    const Model = models[model]
    if (!Model) {
      return response.notFound({ error: 'Modelo não encontrado' })
    }

    const record = await Model.find(id)
    if (!record) {
      return response.notFound({ error: 'Registro não encontrado' })
    }

    try {
      if (model === 'empresas') {
        const deleteMode = request.input('deleteMode', 'logical')
        const empresaId = Number(id)

        if (!Number.isFinite(empresaId) || empresaId <= 0) {
          session.flash('error', 'ID de empresa inválido para deleção.')
          return response.redirect().back()
        }

        if (deleteMode === 'permanent') {
          await empresaDeletionService.permanentDelete(empresaId)
          session.flash(
            'success',
            'Empresa e todas as dependências foram removidas permanentemente.'
          )
        } else {
          await empresaDeletionService.logicalDelete(empresaId)
          session.flash('success', 'Empresa desativada (deleção lógica) com sucesso.')
        }

        return response.redirect().toRoute('admin.list', { model })
      }

      await record.delete()
      session.flash('success', 'Registro deletado com sucesso!')
      return response.redirect().toRoute('admin.list', { model })
    } catch (error) {
      session.flash(
        'error',
        `Erro ao deletar registro: ${error instanceof Error ? error.message : String(error)}`
      )
      return response.redirect().back()
    }
  }

  private parseDataInput(dataInput: unknown): Record<string, any> {
    if (dataInput && typeof dataInput === 'object' && !Array.isArray(dataInput)) {
      const obj = dataInput as Record<string, unknown>

      // Basic structural validation to avoid accepting arbitrary/dangerous objects
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new Error('Chaves inválidas encontradas no objeto "data".')
        }
      }

      return obj as Record<string, any>
    }

    if (typeof dataInput !== 'string' || !dataInput.trim()) {
      throw new Error('Campo "data" obrigatório. Envie um objeto JSON válido.')
    }

    try {
      const parsed = JSON.parse(dataInput)

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON deve ser um objeto no formato { "campo": "valor" }.')
      }

      return parsed
    } catch (error) {
      if (error instanceof Error && error.message.includes('JSON deve ser um objeto')) {
        throw error
      }

      throw new Error('JSON inválido no campo "data". Verifique aspas duplas, vírgulas e chaves.')
    }
  }

  /**
   * Retorna nome legível do modelo
   */
  private getModelName(model: string): string {
    const names: Record<string, string> = {
      users: 'Usuários',
      empresas: 'Empresas',
      fornecedores: 'Fornecedores',
      insumos: 'Insumos',
      notas_fiscais: 'Notas Fiscais',
      cardapio_categorias: 'Categorias do Cardápio',
      cardapio_produtos: 'Produtos do Cardápio',
      comandas: 'Comandas',
      pedidos: 'Pedidos',
      pedido_items: 'Itens de Pedido',
      vendas: 'Vendas',
      venda_items: 'Itens de Venda',
      caixa_registros: 'Registros de Caixa',
      mesas: 'Mesas',
      fiscal_notes: 'Notas Fiscais Eletrônicas',
      fiscal_configs: 'Configurações Fiscais',
      assinaturas_empresas: 'Assinaturas (Empresas)',
      suporte_solicitacoes: 'Solicitações de Suporte',
    }
    return names[model] || model
  }

  /**
   * Exibe formulário para alterar senha de usuário
   */
  async showChangePassword({ params, view }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.load('empresa')

    return view.render('admin/users/change_password', { user })
  }

  /**
   * Processa alteração de senha de usuário
   */
  async changePassword({ params, request, response, session }: HttpContext) {
    const changePasswordSchema = vine.object({
      new_password: vine.string().minLength(6).optional(),
      generate_password: vine.boolean().optional(),
    })

    try {
      const data = await vine.validate({
        schema: changePasswordSchema,
        data: request.all(),
      })

      const user = await User.findOrFail(params.id)

      // Gerar senha aleatória ou usar a fornecida
      const newPassword = data.generate_password ? string.random(12) : data.new_password!

      // Atualizar senha
      user.password = newPassword
      await user.save()

      session.flash('success', `Senha alterada com sucesso! Nova senha: ${newPassword}`)
      return response.redirect().toRoute('admin.show', { model: 'users', id: user.id })
    } catch (error) {
      session.flash(
        'error',
        `Erro ao alterar senha: ${error instanceof Error ? error.message : String(error)}`
      )
      return response.redirect().back()
    }
  }
}
