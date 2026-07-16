import type { HttpContext } from '@adonisjs/core/http'
import inicioRapidoGuide from './guide-content/inicio_rapido.js'
import mesasComandaGuide from './guide-content/mesas_comandas.js'
import painelCozinhaGuide from './guide-content/painel_cozinha.js'
import cardapioGuide from './guide-content/cardapio_gerenciamento.js'
import pedidosGuide from './guide-content/pedidos.js'
import descontosGuide from './guide-content/descontos_taxas.js'
import insumosGuide from './guide-content/gestao_insumos.js'
import notasGuide from './guide-content/notas_fiscais.js'
import caixaGuide from './guide-content/caixa.js'
import relatoriosGuide from './guide-content/relatorios.js'
import usuariosGuide from './guide-content/usuarios.js'
import faqGuide from './guide-content/faq.js'

export default class GuidesController {
  /**
   * Exibir índice de guias
   */
  async index({ view, auth }: HttpContext) {
    await auth.check()

    const guides = [
      {
        slug: 'inicio-rapido',
        titulo: '🚀 Início Rápido',
        descricao: 'Primeiros passos, navegação e conceitos básicos',
        categoria: 'operacional',
        duracao: '15 minutos',
      },
      {
        slug: 'mesas-comandas',
        titulo: '🪑 Mesas e Comandas',
        descricao: 'Como gerenciar mesas, vincular comandas e transferências',
        categoria: 'operacional',
      },
      {
        slug: 'painel-cozinha',
        titulo: '👨‍🍳 Painel da Cozinha',
        descricao: 'Acompanhe pedidos em tempo real, status e priorização',
        categoria: 'operacional',
      },
      {
        slug: 'cardapio-gerenciamento',
        titulo: '🍽️ Gerenciar Cardápio',
        descricao: 'Cadastrar produtos, categorias e receitas',
        categoria: 'cardapio',
      },
      {
        slug: 'pedidos',
        titulo: '📦 Processar Pedidos',
        descricao: 'Criar, editar, cancelar e rastrear pedidos',
        categoria: 'vendas',
      },
      {
        slug: 'descontos-taxas',
        titulo: '💳 Descontos e Taxas',
        descricao: 'Aplicar descontos e taxas de serviço',
        categoria: 'vendas',
      },
      {
        slug: 'gestao-insumos',
        titulo: '🏭 Gestão de Insumos',
        descricao: 'Cadastrar, categorizar e controlar estoque',
        categoria: 'estoque',
      },
      {
        slug: 'notas-fiscais',
        titulo: '📄 Notas Fiscais',
        descricao: 'Importação automática via XML e categorização',
        categoria: 'estoque',
      },
      {
        slug: 'caixa',
        titulo: '💵 Gestão de Caixa',
        descricao: 'Abrir, registrar vendas e fechar caixa',
        categoria: 'financeiro',
      },
      {
        slug: 'relatorios',
        titulo: '📊 Relatórios e Análises',
        descricao: 'Gerar relatórios, visualizar lucratividade',
        categoria: 'financeiro',
      },
      {
        slug: 'usuarios',
        titulo: '👥 Cadastro de Usuários',
        descricao: 'Criar e gerenciar usuários do sistema',
        categoria: 'usuarios',
      },
      {
        slug: 'faq',
        titulo: '❓ FAQ - Perguntas Frequentes',
        descricao: 'Respostas rápidas às dúvidas mais comuns',
        categoria: 'referencias',
      },
    ]

    return view.render('guias/index', { guides })
  }

  /**
   * Exibir um guia específico
   */
  async show({ params, view, auth, response }: HttpContext) {
    await auth.check()

    const guideContent: { [key: string]: { titulo: string; conteudo: string } } = {
      'inicio-rapido': inicioRapidoGuide,
      'mesas-comandas': mesasComandaGuide,
      'painel-cozinha': painelCozinhaGuide,
      'cardapio-gerenciamento': cardapioGuide,
      'pedidos': pedidosGuide,
      'descontos-taxas': descontosGuide,
      'gestao-insumos': insumosGuide,
      'notas-fiscais': notasGuide,
      'caixa': caixaGuide,
      'relatorios': relatoriosGuide,
      'usuarios': usuariosGuide,
      'faq': faqGuide,
    }

    const slug = params.slug

    if (!guideContent[slug]) {
      return response.status(404).redirect(`/guias`)
    }

    const guide = guideContent[slug]

    return view.render('guias/show', {
      titulo: guide.titulo,
      conteudo: guide.conteudo,
      slug,
    })
  }
}
