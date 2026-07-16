import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Empresa from '#models/empresa'

export default class TestController {
  /**
   * Página de teste com informações sobre usuários e empresa
   */
  async index({ view }: HttpContext) {
    try {
      // Buscar dados básicos
      const users = await User.query().preload('empresa').preload('role')
      const companies = await Empresa.all()

      return view.render('test/index', {
        users,
        companies,
        hasUsers: users.length > 0,
      })
    } catch (error) {
      return `Erro: ${error.message}`
    }
  }

  /**
   * Login automático para teste
   */
  async autoLogin({ params, auth, response, session }: HttpContext) {
    try {
      const { email } = params

      const user = await User.findByOrFail('email', email)
      await user.load('empresa')
      await user.load('role')

      await auth.use('web').login(user)
      session.flash('success', `Login automático realizado! Bem-vindo, ${user.fullName}!`)

      return response.redirect().toRoute('dashboard.index')
    } catch (error) {
      return response.status(404).send(`Usuário não encontrado: ${error.message}`)
    }
  }

  /**
   * Limpar sessão e cookies
   */
  async clearSession({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.clear()
    return response.send('Sessão limpa! <a href="/test">Voltar para teste</a>')
  }

  /**
   * Forcar erro 500 em ambiente nao-producao
   */
  async force500({ request, response }: HttpContext) {
    if (process.env.NODE_ENV === 'production') {
      return response.notFound('Rota indisponível')
    }

    const confirm = request.input('confirm')
    if (confirm !== '1') {
      return response.badRequest('Confirme com ?confirm=1')
    }

    throw new Error('Erro forçado para teste de tela 500')
  }
}
