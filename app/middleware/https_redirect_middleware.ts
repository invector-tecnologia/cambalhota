import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'

export default class HttpsRedirectMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    if (app.inProduction && request.protocol() !== 'https') {
      const secureUrl = request.url().replace(/^http:/, 'https:')
      return response.redirect(secureUrl, true, 301)
    }

    await next()
  }
}
