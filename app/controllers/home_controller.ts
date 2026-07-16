import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import SuporteSolicitacao from '#models/suporte_solicitacao'
import SuporteMensagem from '#models/suporte_mensagem'

export default class HomeController {
  /**
   * Exibir a página inicial
   * Se o usuário estiver autenticado, redireciona para o dashboard
   */
  async index({ auth, view, response }: HttpContext) {
    // Verificar se o usuário está autenticado
    await auth.check()

    if (auth.isAuthenticated) {
      // Usuário logado - exibir nome do usuário e botão para o dashboard
      try {
        const user = auth.getUserOrFail()
        await user.load('empresa')
        await user.load('role')

        const html = await view.render('pages/home', {
          user,
          empresa: user.empresa,
          role: user.role,
        })
        return response.type('text/html').send(html)
      } catch (error) {
        return response.status(500).send(`Erro ao carregar dashboard: ${error.message}`)
      }
    } else {
      // Usuário não logado - exibir página inicial
      return view.render('pages/home')
    }
  }

  /**
   * Página de offline fallback
   * Exibida quando o Service Worker não consegue conectar à rede
   */
  async offline({ view }: HttpContext) {
    return view.render('pages/offline')
  }

  /**
   * Recebe formulário de contato comercial da landing
   */
  async submitCommercialContact({ auth, request, response, session }: HttpContext) {
    const nomeContato = String(request.input('nome_contato', '')).trim()
    const emailContato = String(request.input('email_contato', '')).trim().toLowerCase()
    const assunto = String(request.input('assunto', '')).trim()
    const mensagem = String(request.input('mensagem', '')).trim()

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContato)

    if (!nomeContato || !emailContato || !assunto || !mensagem) {
      session.flash('error', 'Preencha nome, e-mail, assunto e mensagem para enviar seu contato.')
      return response.redirect('/#contato')
    }

    if (!emailValido) {
      session.flash('error', 'Informe um e-mail válido para retorno do nosso time.')
      return response.redirect('/#contato')
    }

    let empresaId: number | null = null
    let openedByUserId: number | null = null

    await auth.check()
    if (auth.isAuthenticated) {
      const user = auth.getUserOrFail()
      empresaId = user.empresaId || null
      openedByUserId = user.id
    }

    const protocolo = `COM-${DateTime.now().toFormat('yyyyLLdd')}-${Math.floor(Math.random() * 9000) + 1000}`

    const ticket = await SuporteSolicitacao.create({
      empresaId,
      protocolo,
      openedByUserId,
      nomeContato,
      emailContato,
      assunto,
      mensagem,
      categoria: 'comercial',
      prioridade: 'media',
      status: 'aberto',
      canal: 'landing',
      adminNoReplyStreak: 0,
      ultimaInteracaoUsuarioEm: DateTime.now(),
    })

    await SuporteMensagem.create({
      ticketId: ticket.id,
      senderTipo: 'usuario',
      senderUserId: openedByUserId,
      mensagem,
      lidaUsuarioEm: DateTime.now(),
      lidaAdminEm: null,
    })

    session.flash('success', 'Recebemos seu contato! Nosso time comercial retornará em breve.')
    return response.redirect('/#contato')
  }
}
