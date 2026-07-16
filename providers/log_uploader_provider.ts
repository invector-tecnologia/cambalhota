import type { ApplicationService } from '@adonisjs/core/types'
import env from '#start/env'
import LogUploadService from '#services/log_upload_service'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Provider simples que agenda o upload de logs ao Cloudflare R2
 * Controlado pela variável de ambiente LOG_UPLOAD_ENABLED
 */
export default class LogUploaderProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const enabled = env.get('LOG_UPLOAD_ENABLED', 'false') === 'true'
    const intervalMs = Number(env.get('LOG_UPLOAD_INTERVAL_MS', '300000')) // default 5 min
    const logFilePath = env.get('LOG_FILE_PATH', 'tmp/logs/app.log')

    if (!enabled) {
      console.info('[LogUploaderProvider] Upload de logs desativado (LOG_UPLOAD_ENABLED=false)')
      return
    }

    // Criar diretório de logs se não existir
    try {
      const logDir = path.dirname(logFilePath)
      await fs.mkdir(logDir, { recursive: true })
    } catch (error: any) {
      console.warn('[LogUploaderProvider] Falha ao criar diretório de logs:', error?.message)
    }

    console.info(`[LogUploaderProvider] Upload agendado a cada ${intervalMs}ms`)

    // Agendar execução periódica
    setInterval(async () => {
      try {
        await LogUploadService.uploadCurrentLog()
      } catch (error: any) {
        console.warn('[LogUploaderProvider] Erro no upload agendado:', error?.message)
      }
    }, intervalMs)
  }
}
