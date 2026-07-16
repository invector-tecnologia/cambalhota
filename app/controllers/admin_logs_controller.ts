import { HttpContext } from '@adonisjs/core/http'
import LogUploadService from '#services/log_upload_service'
import logger from '@adonisjs/core/services/logger'

export default class AdminLogsController {
  /**
   * GET /admin/logs/upload-now
   * Força upload imediato do arquivo de log atual ao Cloudflare R2
   */
  async uploadNow({ response, auth }: HttpContext) {
    await auth.authenticate()
    try {
      const res = await LogUploadService.uploadCurrentLog()
      logger.info({ key: res.key }, 'ADMIN_LOGS_UPLOAD_NOW_SUCCESS')
      console.info(`[HEROKU] 🚀 Admin upload manual iniciado → ${res.key || 'sem key'}`)
      return response.json({ success: true, ...res })
    } catch (error: any) {
      logger.warn({ error: error?.message }, 'ADMIN_LOGS_UPLOAD_NOW_FAILED')
      console.error(`[HEROKU] ❌ Admin upload manual falhou → ${error?.message}`)
      return response.status(500).json({ success: false, message: error?.message })
    }
  }

  /**
   * GET /admin/logs/latest
   * Retorna chave e URL (se houver) do último arquivo de log no R2
   */
  async latest({ response, auth }: HttpContext) {
    await auth.authenticate()
    try {
      const res = await LogUploadService.listLatest()
      if (!res.key) {
        return response.json({ success: true, message: 'Nenhum log encontrado no R2' })
      }
      logger.info({ key: res.key }, 'ADMIN_LOGS_LATEST_SUCCESS')
      return response.json({ success: true, ...res })
    } catch (error: any) {
      logger.warn({ error: error?.message }, 'ADMIN_LOGS_LATEST_FAILED')
      return response.status(500).json({ success: false, message: error?.message })
    }
  }
}
