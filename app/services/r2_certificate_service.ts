import env from '#start/env'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Readable } from 'node:stream'
import logger from '@adonisjs/core/services/logger'

interface CertificateUploadResult {
  key: string
  url: string
}

interface DeleteResult {
  success: boolean
}

/**
 * Serviço responsável por gerenciar certificados digitais no Cloudflare R2
 * Segue o mesmo padrão usado para imagens:
 * - Pasta: certificados/
 * - Formato: YYYY-MM-CNPJ-certificado_a1.pfx
 * - Backup automático de certificados antigos
 */
export default class R2CertificateService {
  private static getConfig() {
    const bucket = env.get('R2_BUCKET')
    const accountId = env.get('R2_ACCOUNT_ID')
    const accessKeyId = env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
    const endpoint = env.get('R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`
    const publicBaseUrl = env.get('R2_PUBLIC_BASE_URL')

    return {
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
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
   * Remove um certificado antigo do R2 pela chave
   * Tolera erro 404 se arquivo não existe
   */
  private static async deleteCertificateByKey(client: S3Client, key: string): Promise<void> {
    try {
      const cfg = this.getConfig()
      await client.send(
        new DeleteObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
        })
      )
      logger.info(`[R2CertificateService] Certificado deletado: ${key}`)
    } catch (error: any) {
      if (error?.Code === 'NoSuchKey' || error?.message?.includes('NoSuchKey')) {
        logger.info(`[R2CertificateService] Certificado não encontrado para deletar: ${key}`)
        return
      }
      throw error
    }
  }

  /**
   * Lista certificados antigos da mesma empresa (mesmo CNPJ)
   * Retorna as chaves para possível backup/exclusão
   */
  private static async listExistingCertificates(client: S3Client, cnpj: string): Promise<string[]> {
    try {
      const cfg = this.getConfig()
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: `certificados/${cnpj}`,
        })
      )

      return result.Contents?.map((obj) => obj.Key || '').filter(Boolean) || []
    } catch (error: any) {
      logger.warn(`[R2CertificateService] Erro ao listar certificados antigos: ${error?.message}`)
      return []
    }
  }

  /**
   * Faz upload de certificado para R2
   * Segue padrão: YYYY-MM-CNPJ-certificado_a1.pfx
   *
   * Automaticamente:
   * 1. Deleta certificado anterior de mesmo CNPJ
   * 2. Upload para R2 com novo nome
   * 3. Retorna caminho completo no R2
   */
  static async uploadCertificate(filePath: string, cnpj: string): Promise<CertificateUploadResult> {
    const cfg = this.getConfig()

    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      throw new Error('Configuração R2 incompleta para upload de certificado')
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)

      // Lê o arquivo do certificado
      const fileData = await fs.readFile(filePath)

      // Gera nome no formato: YYYY-MM-CNPJ-certificado_a1.pfx
      const now = new Date()
      const yyyy = String(now.getUTCFullYear())
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0')

      // Sanitiza CNPJ (remove caracteres especiais)
      const cnpjClean = cnpj.replace(/\D/g, '')

      const fileName = `${yyyy}-${mm}-${cnpjClean}-certificado_a1.pfx`
      const key = `certificados/${cnpjClean}/${fileName}`

      // Busca certificados antigos do mesmo CNPJ
      const existingCerts = await this.listExistingCertificates(client, cnpjClean)

      // Remove certificados antigos (deixa apenas o novo)
      for (const oldKey of existingCerts) {
        if (oldKey !== key) {
          logger.info(`[R2CertificateService] Deletando certificado anterior: ${oldKey}`)
          await this.deleteCertificateByKey(client, oldKey)
        }
      }

      // Faz upload do novo certificado
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: fileData,
          ContentType: 'application/x-pkcs12',
          // Metadata opcional para auditoria
          Metadata: {
            'upload-date': new Date().toISOString(),
            'cnpj': cnpjClean,
          },
        })
      )

      const url = cfg.publicBaseUrl ? `${cfg.publicBaseUrl}/${key}` : undefined

      logger.info(
        `[R2CertificateService] Certificado enviado para R2: ${key} | url=${url || 'N/A'}`
      )

      return {
        key,
        url: url || key,
      }
    } catch (error: any) {
      logger.error(
        { error: error?.message, stack: error?.stack },
        '[R2CertificateService] Erro ao fazer upload de certificado'
      )
      throw new Error(
        `Falha ao enviar certificado para Cloudflare R2: ${error?.message || 'erro desconhecido'}`
      )
    }
  }

  /**
   * Remove um certificado do R2 pela chave completa
   * Usado ao deletar configuração fiscal
   */
  static async deleteCertificate(key: string): Promise<DeleteResult> {
    const cfg = this.getConfig()

    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      logger.warn('[R2CertificateService] Configuração R2 incompleta, delete ignorado')
      return { success: false }
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)
      await this.deleteCertificateByKey(client, key)
      return { success: true }
    } catch (error: any) {
      logger.error(
        { error: error?.message },
        '[R2CertificateService] Erro ao deletar certificado do R2'
      )
      return { success: false }
    }
  }

  /**
   * Retorna diagnóstico do serviço
   */
  static getDiagnostics(): Record<string, any> {
    const cfg = this.getConfig()
    return {
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      publicBaseUrl: cfg.publicBaseUrl,
      configured:
        !!(cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey) &&
        cfg.bucket !== '' &&
        cfg.accessKeyId !== '' &&
        cfg.secretAccessKey !== '',
    }
  }

  /**
   * Baixa um certificado do R2 e o salva temporariamente no disco
   * Retorna o caminho local do arquivo
   *
   * OBS: O arquivo temporário deve ser deletado após ser usado
   */
  static async downloadCertificateTemp(r2Key: string): Promise<string> {
    const cfg = this.getConfig()

    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      throw new Error('Configuração R2 incompleta para download de certificado')
    }

    try {
      const client = this.createClient(cfg.endpoint, cfg.accessKeyId, cfg.secretAccessKey)

      // Faz o download do objeto do R2
      const result = await client.send(
        new GetObjectCommand({
          Bucket: cfg.bucket,
          Key: r2Key,
        })
      )

      // Cria diretório temporário se não existir
      const tmpDir = path.join('tmp', 'certificates')
      await fs.mkdir(tmpDir, { recursive: true })

      // Salva o arquivo temporário
      const tempFileName = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pfx`
      const tempPath = path.join(tmpDir, tempFileName)

      // Converte o Body em buffer
      if (!result.Body) {
        throw new Error('Certificado vazio no R2')
      }

      const buffer = await this.readBodyToBuffer(result.Body)
      if (!buffer.length) {
        throw new Error('Certificado vazio ou download incompleto do R2')
      }

      // Salva o buffer no arquivo temporário
      await fs.writeFile(tempPath, buffer)

      logger.info(
        `[R2CertificateService] Certificado baixado temporariamente: ${r2Key} → ${tempPath}`
      )

      return tempPath
    } catch (error: any) {
      logger.error(
        { error: error?.message, r2Key },
        '[R2CertificateService] Erro ao baixar certificado do R2'
      )
      throw new Error(
        `Falha ao baixar certificado do Cloudflare R2: ${error?.message || 'erro desconhecido'}`
      )
    }
  }

  private static async readBodyToBuffer(body: any): Promise<Buffer> {
    if (Buffer.isBuffer(body)) {
      return body
    }

    if (typeof body === 'string') {
      return Buffer.from(body)
    }

    if (typeof body?.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray()
      return Buffer.from(bytes)
    }

    if (body instanceof Readable || typeof body?.pipe === 'function') {
      const chunks: Buffer[] = []
      for await (const chunk of body as AsyncIterable<Buffer | string>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    }

    return Buffer.alloc(0)
  }

  /**
   * Limpa um arquivo de certificado temporário
   */
  static async cleanupTempCertificate(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
      logger.info(`[R2CertificateService] Arquivo temporário deletado: ${filePath}`)
    } catch (error: any) {
      logger.warn(`[R2CertificateService] Erro ao limpar arquivo temporário: ${error?.message}`)
    }
  }
}
