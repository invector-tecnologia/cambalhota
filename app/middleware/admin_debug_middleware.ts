import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para debug de requisições admin
 */
export default class AdminDebugMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    console.log('Original Method:', request.request.method)
    console.log('Method (after spoofing):', request.method())
    console.log('URL:', request.url())
    // matchedRoute API não está disponível nesta versão; omitindo detalhes de rota
    console.log('Params:', request.params())
    console.log('Body:', request.all())
    console.log('_method:', request.input('_method'))
    console.log('Has _method in body?', '_method' in request.all())
    console.log('Headers:', {
      'content-type': request.header('content-type'),
      'x-csrf-token': request.header('x-csrf-token'),
    })

    return next()
  }
}
