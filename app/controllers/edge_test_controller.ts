import type { HttpContext } from '@adonisjs/core/http'

export default class EdgeTestController {
  /**
   * Teste simples sem layouts
   */
  async simple({ view }: HttpContext) {
    try {
      const html = await view.render('test/edge-simple')
      return html
    } catch (error) {
      return `Erro no teste simples: ${error.message}`
    }
  }

  /**
   * Teste com layout básico
   */
  async withLayout({ view }: HttpContext) {
    try {
      const html = await view.render('test/edge-with-layout')
      return html
    } catch (error) {
      return `Erro no teste com layout: ${error.message}`
    }
  }

  /**
   * Teste do dashboard real
   */
  async dashboard({ view }: HttpContext) {
    try {
      const html = await view.render('dashboard/index', {
        user: {
          id: 1,
          fullName: 'Teste User',
          email: 'teste@test.com',
        },
        empresa: {
          id: 1,
          name: 'Teste Company',
          active: true,
        },
        role: {
          id: 1,
          name: 'admin',
        },
      })
      return html
    } catch (error) {
      return `Erro no dashboard: ${error.message} - Stack: ${error.stack}`
    }
  }

  /**
   * Informações sobre Edge.js
   */
  async edgeInfo({ response }: HttpContext) {
    try {
      await import('edge.js')
      const info = {
        edgeVersion: 'Edge.js importado com sucesso',
        nodeEnv: process.env.NODE_ENV,
        viewsPath: 'resources/views',
      }
      return response.json(info)
    } catch (error) {
      return response.json({
        error: error.message,
        stack: error.stack,
      })
    }
  }
}
