import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import SuporteSolicitacao from '#models/suporte_solicitacao'
import SuporteMensagem from '#models/suporte_mensagem'

type SenderTipo = 'usuario' | 'admin' | 'sistema'

export default class SupportTicketService {
  async addMessage(params: {
    ticketId: number
    senderTipo: SenderTipo
    senderUserId?: number | null
    mensagem: string
  }) {
    const now = DateTime.now()

    return db.transaction(async (trx) => {
      const ticket = await SuporteSolicitacao.query({ client: trx })
        .where('id', params.ticketId)
        .firstOrFail()

      if (['resolvido', 'fechado', 'cancelado'].includes(ticket.status)) {
        throw new Error('Ticket encerrado. Não é possível enviar novas mensagens.')
      }

      await SuporteMensagem.create(
        {
          ticketId: ticket.id,
          senderTipo: params.senderTipo,
          senderUserId: params.senderUserId ?? null,
          mensagem: params.mensagem,
          lidaUsuarioEm: params.senderTipo === 'usuario' ? now : null,
          lidaAdminEm: params.senderTipo === 'admin' ? now : null,
        },
        { client: trx }
      )

      if (params.senderTipo === 'usuario') {
        ticket.adminNoReplyStreak = 0
        ticket.status = ticket.status === 'novo' ? 'aberto' : 'em_andamento'
        ticket.ultimaInteracaoUsuarioEm = now
      }

      if (params.senderTipo === 'admin') {
        ticket.adminNoReplyStreak = (ticket.adminNoReplyStreak || 0) + 1
        ticket.status = 'aguardando_usuario'
        ticket.ultimaInteracaoAdminEm = now

        if (ticket.adminNoReplyStreak >= 3) {
          ticket.status = 'resolvido'
          ticket.resolvidoEm = now
          ticket.resolvidoPor = 'auto_timeout'
          ticket.resolucaoMotivo =
            'Ticket resolvido automaticamente após 3 mensagens consecutivas do administrador sem resposta do usuário.'

          await SuporteMensagem.create(
            {
              ticketId: ticket.id,
              senderTipo: 'sistema',
              senderUserId: null,
              mensagem:
                'Ticket resolvido automaticamente por ausência de resposta do usuário após 3 interações do administrador.',
              lidaUsuarioEm: null,
              lidaAdminEm: now,
            },
            { client: trx }
          )
        }
      }

      if (params.senderTipo === 'sistema') {
        ticket.ultimaInteracaoAdminEm = now
      }

      await ticket.useTransaction(trx).save()
      return ticket
    })
  }

  async suggestSolution(params: { ticketId: number; adminUserId: number; mensagem: string }) {
    const now = DateTime.now()

    return db.transaction(async (trx) => {
      const ticket = await SuporteSolicitacao.query({ client: trx })
        .where('id', params.ticketId)
        .firstOrFail()

      if (['resolvido', 'fechado', 'cancelado'].includes(ticket.status)) {
        throw new Error('Ticket encerrado. Não é possível sugerir solução.')
      }

      ticket.status = 'solucao_sugerida'
      ticket.solucaoSugeridaEm = now
      ticket.ultimaInteracaoAdminEm = now
      ticket.adminNoReplyStreak = (ticket.adminNoReplyStreak || 0) + 1
      await ticket.useTransaction(trx).save()

      await SuporteMensagem.create(
        {
          ticketId: ticket.id,
          senderTipo: 'admin',
          senderUserId: params.adminUserId,
          mensagem: params.mensagem,
          lidaUsuarioEm: null,
          lidaAdminEm: now,
        },
        { client: trx }
      )

      if (ticket.adminNoReplyStreak >= 3) {
        ticket.status = 'resolvido'
        ticket.resolvidoEm = now
        ticket.resolvidoPor = 'auto_timeout'
        ticket.resolucaoMotivo =
          'Ticket resolvido automaticamente após 3 mensagens consecutivas do administrador sem resposta do usuário.'
        await ticket.useTransaction(trx).save()

        await SuporteMensagem.create(
          {
            ticketId: ticket.id,
            senderTipo: 'sistema',
            senderUserId: null,
            mensagem:
              'Ticket resolvido automaticamente por ausência de resposta do usuário após 3 interações do administrador.',
            lidaUsuarioEm: null,
            lidaAdminEm: now,
          },
          { client: trx }
        )
      }

      return ticket
    })
  }
}
