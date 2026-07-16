import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para verificar se o usuário é superadmin
 */
export default class SuperadminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = await auth.authenticate()
    await user.load('role')

    if (user.role.name !== 'superadmin') {
      return response.forbidden({
        error: 'Acesso negado. Apenas superadmins podem acessar esta área.',
      })
    }

    return next()
  }
}
