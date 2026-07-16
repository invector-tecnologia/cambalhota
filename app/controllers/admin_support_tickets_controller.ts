import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import SuporteSolicitacao from '#models/suporte_solicitacao'
import SuporteMensagem from '#models/suporte_mensagem'
import SupportTicketService from '#services/support_ticket_service'

const supportTicketService = new SupportTicketService()

export default class AdminSupportTicketsController {
  async index({ request, view }: HttpContext) {
    const status = String(request.input('status', '')).trim()

    const query = SuporteSolicitacao.query().preload('empresa').preload('openedByUser')

    if (status) {
      query.where('status', status)
    }

    const tickets = await query.orderBy('updated_at', 'desc').paginate(1, 60)

    return view.render('admin/support_tickets/index', {
      tickets: tickets.serialize(),
      status,
    })
  }

  async show({ params, view, response }: HttpContext) {
    const ticket = await SuporteSolicitacao.query()
      .where('id', params.id)
      .preload('empresa')
      .preload('openedByUser')
      .first()

    if (!ticket) {
      return response.notFound({ error: 'Ticket não encontrado' })
    }

    await SuporteMensagem.query()
      .where('ticket_id', ticket.id)
      .where('sender_tipo', 'usuario')
      .whereNull('lida_admin_em')
      .update({ lida_admin_em: DateTime.now().toSQL() })

    const mensagens = await SuporteMensagem.query()
      .where('ticket_id', ticket.id)
      .preload('senderUser')
      .orderBy('created_at', 'asc')

    return view.render('admin/support_tickets/show', {
      ticket: ticket.serialize(),
      mensagens: mensagens.map((m) => m.serialize()),
    })
  }

  async reply({ auth, params, request, response, session }: HttpContext) {
    const adminUser = auth.getUserOrFail()
    const mensagem = String(request.input('mensagem', '')).trim()

    if (!mensagem) {
      session.flash('error', 'Mensagem obrigatória.')
      return response.redirect().back()
    }

    await supportTicketService.addMessage({
      ticketId: Number(params.id),
      senderTipo: 'admin',
      senderUserId: adminUser.id,
      mensagem,
    })

    session.flash('success', 'Resposta enviada ao usuário.')
    return response.redirect().back()
  }

  async suggestSolution({ auth, params, request, response, session }: HttpContext) {
    const adminUser = auth.getUserOrFail()
    const mensagem = String(request.input('mensagem', '')).trim()

    if (!mensagem) {
      session.flash('error', 'A sugestão de solução deve conter uma mensagem.')
      return response.redirect().back()
    }

    await supportTicketService.suggestSolution({
      ticketId: Number(params.id),
      adminUserId: adminUser.id,
      mensagem,
    })

    session.flash('success', 'Sugestão de solução enviada ao usuário.')
    return response.redirect().back()
  }
}
