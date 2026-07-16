import env from '#start/env'
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import logger from '@adonisjs/core/services/logger'

/**
 * Serviço responsável por enviar arquivos de log para o Cloudflare R2
 * Usa API compatível com S3 (@aws-sdk/client-s3)
 */
export default class LogUploadService {
  private static getConfig() {
    const bucket = env.get('R2_BUCKET')
    const accountId = env.get('R2_ACCOUNT_ID')
    const accessKeyId = env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
    const endpoint = env.get('R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`
    const logFilePath = env.get('LOG_FILE_PATH', 'tmp/logs/app.log')
    const publicBaseUrl = env.get('R2_PUBLIC_BASE_URL') // opcional, para gerar links públicos

    return {
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
      logFilePath,
      publicBaseUrl,
    }
  }

  private static createClient(endpoint: string, accessKeyId: string, secretAccessKey: string) {
    return new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  /**
   * Faz upload do arquivo de log atual para o R2
   * Cria um objeto com chave única baseada na data
   */
  static async uploadCurrentLog(): Promise<{ key?: string; url?: string }> {
    const cfg = this.getConfig()

    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      logger.warn('LogUploadService: Configuração R2 incompleta, upload ignorado')
      return {}
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)
      const filePath = path.resolve(cfg.logFilePath)
      const fileData = await fs.readFile(filePath)

      const now = new Date()
      const yyyy = String(now.getUTCFullYear())
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(now.getUTCDate()).padStart(2, '0')
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const key = `logs/${yyyy}/${mm}/${dd}/app-${yyyy}${mm}${dd}-${hh}.log`

      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: fileData,
          ContentType: 'text/plain',
        })
      )

      const url = cfg.publicBaseUrl ? `${cfg.publicBaseUrl}/${key}` : undefined
      logger.info({ key, url }, 'LogUploadService: Upload de logs concluído com sucesso')
      console.info(`[HEROKU] ✅ LogUploadService: Arquivo enviado para R2 → ${key}`)
      return { key, url }
    } catch (error: any) {
      logger.warn({ error: error?.message }, 'LogUploadService: Falha ao enviar logs ao R2')
      console.error(`[HEROKU] ❌ LogUploadService: Falha ao enviar logs → ${error?.message}`)
      return {}
    }
  }

  /**
   * Lista o último arquivo de log enviado ao R2 e retorna sua URL (se configurada)
   */
  static async listLatest(): Promise<{ key?: string; url?: string }> {
    const cfg = this.getConfig()
    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      logger.warn('LogUploadService: Configuração R2 incompleta, listagem ignorada')
      return {}
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)
      const res = await client.send(
        new ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: 'logs/' })
      )

      const contents = res.Contents || []
      if (contents.length === 0) {
        return {}
      }

      // Escolher o mais recente por LastModified
      contents.sort((a, b) => {
        const at = a.LastModified?.getTime() || 0
        const bt = b.LastModified?.getTime() || 0
        return bt - at
      })

      const key = contents[0].Key
      const url = key && cfg.publicBaseUrl ? `${cfg.publicBaseUrl}/${key}` : undefined
      return { key, url }
    } catch (error: any) {
      logger.warn({ error: error?.message }, 'LogUploadService: Falha ao listar logs no R2')
      return {}
    }
  }

  /**
   * Faz upload de conteúdo de log direto ao R2 (usado por Heroku Log Drain)
   * Agrupa logs por hora em um bucket separado/prefixo 'drain/'
   */
  static async uploadToDrainBucket(logContent: string): Promise<{ key?: string; url?: string }> {
    const cfg = this.getConfig()

    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      console.warn('LogUploadService: Configuração R2 incompleta, drain upload ignorado')
      return {}
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)

      const now = new Date()
      const yyyy = String(now.getUTCFullYear())
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(now.getUTCDate()).padStart(2, '0')
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const min = String(now.getUTCMinutes()).padStart(2, '0')
      const sec = String(now.getUTCSeconds()).padStart(2, '0')
      // R2 bucket: tavolo; desired key prefix: tavolo/logs/yyyy/mm/dd/*.log
      const key = `logs/${yyyy}/${mm}/${dd}/drain-${yyyy}${mm}${dd}-${hh}${min}${sec}.log`

      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: logContent,
          ContentType: 'text/plain',
        })
      )

      const url = cfg.publicBaseUrl ? `${cfg.publicBaseUrl}/${key}` : undefined
      console.info(`[LogUploadService] Drain upload: ${key}`)
      return { key, url }
    } catch (error: any) {
      console.warn(`[LogUploadService] Falha no drain upload: ${error?.message}`)
      return {}
    }
  }
}
