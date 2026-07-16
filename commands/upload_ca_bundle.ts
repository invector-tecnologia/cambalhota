import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Envia um CA bundle PEM para o Cloudflare R2
 * Uso: node ace upload:ca:bundle /caminho/para/icp-brasil.pem --key certificados/ca/icp-brasil.pem
 */
export default class UploadCaBundle extends BaseCommand {
  static commandName = 'upload:ca:bundle'
  static description = 'Envia CA bundle PEM para o R2'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Caminho local do arquivo PEM' })
  declare filePath: string

  @flags.string({ description: 'Chave no R2 (ex: certificados/ca/icp-brasil.pem)' })
  declare key?: string

  async run() {
    const env = await import('#start/env')
    const envInstance = env.default

    const accessKeyId = envInstance.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = envInstance.get('R2_SECRET_ACCESS_KEY')
    const endpoint = envInstance.get('R2_ENDPOINT')
    const bucket = envInstance.get('R2_BUCKET')

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) {
      this.logger.error('Credenciais R2 nao configuradas')
      this.logger.info('Configure: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET')
      return
    }

    const resolvedPath = path.resolve(this.filePath)
    const body = await fs.readFile(resolvedPath)

    const key = this.key || 'certificados/ca/icp-brasil.pem'

    const s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'application/x-pem-file',
      })
    )

    this.logger.success(`CA bundle enviado: ${bucket}/${key}`)
  }
}
