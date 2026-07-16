import { HttpContext } from '@adonisjs/core/http'
import LogUploadService from '#services/log_upload_service'

/**
 * Controller para receber logs via Heroku Log Drain
 * Heroku envia logs continuamente via HTTP POST
 * Formato: syslog ou plain text com múltiplas linhas
 */
export default class LogDrainController {
  /**
   * POST /logs/drain
   * Recebe logs do Heroku Log Drain, exibe no console e envia para Cloudflare R2
   */
  async receive({ request, response }: HttpContext) {
    try {
      // Heroku envia logs como plain text (cada linha é um log)
      const rawBody = JSON.stringify(request.body())
      if (!rawBody) {
        return response.status(204).send('')
      }

      const logLines = rawBody
        .toString()
        .split('\n')
        .filter((line: any) => line.trim().length > 0)

      // Exibir cada linha no console (aparece no Heroku logs)
      for (const line of logLines) {
        console.log(line)
      }

      // Fazer batch upload para Cloudflare R2
      if (logLines.length > 0) {
        const logContent = logLines.join('\n')
        await LogUploadService.uploadToDrainBucket(logContent)
      }

      // Heroku espera 200 OK
      return response.status(200).send('')
    } catch (error: any) {
      console.error('[LogDrainController] Erro ao processar drain:', error?.message)
      // Retornar 200 mesmo em erro para não sobrecarregar Heroku
      return response.status(200).send('')
    }
  }
}
