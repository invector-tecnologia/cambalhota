import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import env from '#start/env'
import cloudLogger from '#services/cloud_logger'

/**
 * Worker que roda em background para enviar logs para R2
 *
 * IMPORTANTE: Este comando roda continuamente e nunca termina.
 * Use apenas em worker dynos no Heroku (Procfile: worker: node ace upload:logs:worker)
 *
 * Para execuções pontuais no Heroku Scheduler, use: node ace upload:logs:once
 *
 * COMO USAR:
 * 1. Em desenvolvimento: node ace upload:logs:worker
 * 2. No Heroku Worker Dyno: adicionar "worker: cd build && node ace.js upload:logs:worker" no Procfile
 * 3. NO HEROKU SCHEDULER: USE "node ace upload:logs:once" em vez deste comando
 */
export default class UploadLogsWorker extends BaseCommand {
  static commandName = 'upload:logs:worker'
  static description = 'Worker que envia logs acumulados para Cloudflare R2'

  static options: CommandOptions = {
    startApp: true,
  }

  private s3Client: S3Client | null = null
  private isEnabled: boolean = false
  private intervalSeconds: number = 30
  private intervalHandle: NodeJS.Timeout | null = null

  /**
   * Inicializa cliente S3
   */
  private initializeS3Client(): boolean {
    try {
      const accessKeyId = env.get('R2_ACCESS_KEY_ID')
      const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
      const endpoint = env.get('R2_ENDPOINT')

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        this.logger.warning('❌ Credenciais R2 não configuradas - worker desabilitado')
        return false
      }

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      this.logger.info('✅ Cliente R2 inicializado com sucesso')
      return true
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar cliente R2:', error)
      return false
    }
  }

  /**
   * Upload de logs para R2
   */
  private async uploadLogs(): Promise<void> {
    try {
      // Pega logs acumulados
      const logs = cloudLogger.flush()

      if (logs.length === 0) {
        this.logger.debug('📋 Nenhum log para enviar')
        return
      }

      if (!this.s3Client) {
        this.logger.warning('⚠️  Cliente R2 não inicializado - descartando logs')
        return
      }

      const bucket = env.get('R2_BUCKET', 'tavolo-logs')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const key = `logs/${timestamp}.json`

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(logs, null, 2),
        ContentType: 'application/json',
      })

      await this.s3Client.send(command)

      this.logger.info(`✅ ${logs.length} logs enviados para R2: ${key}`)
      console.info(`[HEROKU] ✅ R2 Upload: ${logs.length} logs → ${key}`)
    } catch (error) {
      this.logger.error('❌ Erro ao enviar logs para R2:', error)
      console.error(`[HEROKU] ❌ R2 Upload failed: ${error.message || String(error)}`)
      // Não re-throw - worker continua rodando
    }
  }

  /**
   * Loop principal do worker
   */
  private startWorkerLoop(): void {
    this.logger.info(`🔄 Worker iniciado - enviando logs a cada ${this.intervalSeconds}s`)

    this.intervalHandle = setInterval(async () => {
      await this.uploadLogs()
    }, this.intervalSeconds * 1000)
  }

  /**
   * Para o worker gracefully
   */
  private stopWorker(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
    this.logger.info('🛑 Worker parado')
  }

  /**
   * Executa o comando
   */
  async run(): Promise<void> {
    this.logger.info('🚀 Iniciando Upload Logs Worker...')

    // Verifica se está habilitado
    this.isEnabled = env.get('LOG_UPLOAD_ENABLED') === 'true'

    if (!this.isEnabled) {
      this.logger.warning('⚠️  LOG_UPLOAD_ENABLED não está true - worker não será iniciado')
      this.logger.info('💡 Para habilitar, defina: LOG_UPLOAD_ENABLED=true')
      return
    }

    // Inicializa cliente R2
    if (!this.initializeS3Client()) {
      this.logger.error('❌ Falha ao inicializar cliente R2 - worker não será iniciado')
      return
    }

    // Configura intervalo (default 30s)
    const customInterval = env.get('LOG_UPLOAD_INTERVAL_SECONDS')
    if (customInterval) {
      this.intervalSeconds = Number.parseInt(customInterval, 10)
    }

    // Inicia loop
    this.startWorkerLoop()

    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.info('📥 SIGTERM recebido - encerrando worker...')
      this.stopWorker()
      process.exit(0)
    })

    process.on('SIGINT', () => {
      this.logger.info('📥 SIGINT recebido - encerrando worker...')
      this.stopWorker()
      process.exit(0)
    })

    // Mantém processo vivo
    await new Promise(() => {}) // Nunca resolve
  }
}
