import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import SuporteSolicitacao from '#models/suporte_solicitacao'
import SuporteMensagem from '#models/suporte_mensagem'
import SupportTicketService from '#services/support_ticket_service'

const supportTicketService = new SupportTicketService()

export default class SupportTicketsController {
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    const [tickets, unreadCountRows] = await Promise.all([
      SuporteSolicitacao.query()
        .where('opened_by_user_id', user.id)
        .orderBy('updated_at', 'desc')
        .paginate(1, 50),
      SuporteMensagem.query()
        .join('suporte_solicitacoes', 'suporte_solicitacoes.id', 'suporte_mensagens.ticket_id')
        .where('suporte_solicitacoes.opened_by_user_id', user.id)
        .whereIn('suporte_mensagens.sender_tipo', ['admin', 'sistema'])
        .whereNull('suporte_mensagens.lida_usuario_em')
        .count('* as total'),
    ])

    return view.render('support_tickets/index', {
      tickets: tickets.serialize(),
      unreadCount: Number(unreadCountRows[0]?.$extras?.total || 0),
    })
  }

  async create({ view }: HttpContext) {
    return view.render('support_tickets/create')
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const assunto = String(request.input('assunto', '')).trim()
    const mensagem = String(request.input('mensagem', '')).trim()
    const categoria = String(request.input('categoria', 'duvida')).trim()
    const prioridade = String(request.input('prioridade', 'media')).trim()

    if (!assunto || !mensagem) {
      session.flash('error', 'Assunto e mensagem são obrigatórios.')
      return response.redirect().back()
    }

    const protocolo = `SUP-${DateTime.now().toFormat('yyyyLLdd')}-${Math.floor(Math.random() * 9000) + 1000}`

    const ticket = await SuporteSolicitacao.create({
      empresaId: user.empresaId,
      protocolo,
      openedByUserId: user.id,
      nomeContato: user.fullName || user.email,
      emailContato: user.email,
      assunto,
      mensagem,
      categoria,
      prioridade: prioridade as any,
      status: 'aberto',
      canal: 'painel',
      adminNoReplyStreak: 0,
      ultimaInteracaoUsuarioEm: DateTime.now(),
    })

    await SuporteMensagem.create({
      ticketId: ticket.id,
      senderTipo: 'usuario',
      senderUserId: user.id,
      mensagem,
      lidaUsuarioEm: DateTime.now(),
      lidaAdminEm: null,
    })

    session.flash('success', `Ticket ${protocolo} criado com sucesso.`)
    return response.redirect().toRoute('supportTickets.show', { id: ticket.id })
  }

  async show({ auth, params, response, view }: HttpContext) {
    const user = auth.getUserOrFail()

    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .where('opened_by_user_id', user.id)
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    await SuporteMensagem.query()
      .where('ticket_id', ticket.id)
      .whereIn('sender_tipo', ['admin', 'sistema'])
      .whereNull('lida_usuario_em')
      .update({ lida_usuario_em: DateTime.now().toSQL() })

    const mensagens = await SuporteMensagem.query()
      .where('ticket_id', ticket.id)
      .preload('senderUser')
      .orderBy('created_at', 'asc')

    return view.render('support_tickets/show', {
      ticket: ticket.serialize(),
      mensagens: mensagens.map((m) => m.serialize()),
    })
  }

  async reply({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const mensagem = String(request.input('mensagem', '')).trim()

    if (!mensagem) {
      session.flash('error', 'Mensagem obrigatória.')
      return response.redirect().back()
    }

    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .where('opened_by_user_id', user.id)
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    await supportTicketService.addMessage({
      ticketId: ticket.id,
      senderTipo: 'usuario',
      senderUserId: user.id,
      mensagem,
    })

    session.flash('success', 'Resposta enviada para o suporte.')
    return response.redirect().back()
  }

  async cancel({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .where('opened_by_user_id', user.id)
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    if (['resolvido', 'fechado', 'cancelado'].includes(ticket.status)) {
      session.flash('error', 'Este ticket já foi encerrado.')
      return response.redirect().back()
    }

    ticket.status = 'cancelado'
    ticket.canceladoEm = DateTime.now()
    await ticket.save()

    await SuporteMensagem.create({
      ticketId: ticket.id,
      senderTipo: 'sistema',
      senderUserId: null,
      mensagem: 'Ticket cancelado pelo usuário.',
      lidaUsuarioEm: DateTime.now(),
      lidaAdminEm: null,
    })

    session.flash('success', 'Ticket cancelado com sucesso.')
    return response.redirect().toRoute('supportTickets.index')
  }

  async confirmSolution({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .where('opened_by_user_id', user.id)
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    ticket.status = 'resolvido'
    ticket.resolvidoEm = DateTime.now()
    ticket.resolvidoPor = 'usuario_confirmou'
    ticket.resolucaoMotivo =
      'Usuário confirmou que a sugestão do administrador solucionou o problema.'
    await ticket.save()

    await SuporteMensagem.create({
      ticketId: ticket.id,
      senderTipo: 'sistema',
      senderUserId: null,
      mensagem: 'Usuário confirmou a solução e encerrou o ticket.',
      lidaUsuarioEm: DateTime.now(),
      lidaAdminEm: null,
    })

    session.flash('success', 'Ticket marcado como resolvido.')
    return response.redirect().back()
  }

  async rejectSolution({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .where('opened_by_user_id', user.id)
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    if (
      ticket.status === 'cancelado' ||
      ticket.status === 'resolvido' ||
      ticket.status === 'fechado'
    ) {
      session.flash('error', 'Ticket encerrado. Não é possível reabrir por este fluxo.')
      return response.redirect().back()
    }

    ticket.status = 'em_andamento'
    ticket.adminNoReplyStreak = 0
    ticket.ultimaInteracaoUsuarioEm = DateTime.now()
    await ticket.save()

    await SuporteMensagem.create({
      ticketId: ticket.id,
      senderTipo: 'usuario',
      senderUserId: user.id,
      mensagem: 'Usuário informou que a sugestão de solução não resolveu o problema.',
      lidaUsuarioEm: DateTime.now(),
      lidaAdminEm: null,
    })

    session.flash('success', 'Reabertura registrada. O suporte foi notificado.')
    return response.redirect().back()
  }
}
