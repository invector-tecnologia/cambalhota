import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * Comando pontual para enviar logs para R2 (ideal para Heroku Scheduler)
 *
 * COMO USAR:
 * 1. Em desenvolvimento: node ace upload:logs:once
 * 2. No Heroku Scheduler: node ace upload:logs:once
 */
export default class UploadLogsOnce extends BaseCommand {
  static commandName = 'upload:logs:once'
  static description = 'Envia logs acumulados para Cloudflare R2 (execução única)'

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Executa o comando
   */
  async run(): Promise<void> {
    try {
      this.logger.info('🚀 Iniciando upload de logs para R2...')

      // Importa env dinamicamente após app estar pronto
      const env = await import('#start/env')
      const envInstance = env.default

      // Verifica se está habilitado
      const isEnabled = envInstance.get('LOG_UPLOAD_ENABLED') === 'true'

      if (!isEnabled) {
        this.logger.warning('⚠️  LOG_UPLOAD_ENABLED não está true - upload cancelado')
        this.logger.info('💡 Para habilitar, defina: LOG_UPLOAD_ENABLED=true')
        return
      }

      // Verifica credenciais
      const accessKeyId = envInstance.get('R2_ACCESS_KEY_ID')
      const secretAccessKey = envInstance.get('R2_SECRET_ACCESS_KEY')
      const endpoint = envInstance.get('R2_ENDPOINT')

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        this.logger.error('❌ Credenciais R2 não configuradas')
        this.logger.info('💡 Configure: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT')
        return
      }

      // Importa cloudLogger dinamicamente
      const { default: cloudLogger } = await import('#services/cloud_logger')

      // Pega logs acumulados
      const logs = cloudLogger.flush()

      if (logs.length === 0) {
        this.logger.info('📋 Nenhum log para enviar')
        return
      }

      // Inicializa cliente S3
      const s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      // Prepara upload
      const bucket = envInstance.get('R2_BUCKET', 'tavolo-logs')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const key = `logs/${timestamp}.json`

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(logs, null, 2),
        ContentType: 'application/json',
      })

      // Envia logs
      await s3Client.send(command)

      this.logger.info(`✅ ${logs.length} logs enviados para R2: ${key}`)
      this.logger.info(`📦 Bucket: ${bucket}`)
      this.logger.info(`🔑 Key: ${key}`)
      console.info(`[HEROKU] ✅ R2 Upload: ${logs.length} logs → ${bucket}/${key}`)
    } catch (error) {
      this.logger.error('❌ Erro ao enviar logs para R2:')
      this.logger.error(error)
      console.error(`[HEROKU] ❌ R2 Upload failed: ${error.message || String(error)}`)
      throw error
    }
  }
}
