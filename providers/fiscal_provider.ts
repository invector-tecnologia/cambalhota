import { ApplicationService } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'
import * as fs from 'node:fs/promises'
import env from '#start/env'
import * as crypto from 'node:crypto'

/**
 * FiscalProvider - Carrega e gerencia certificados A1 em memória
 * Garantir que as chaves do certificado sejam carregadas de forma segura
 * apenas durante o processo de assinatura
 */
export default class FiscalProvider {
  private static certificateCache: Map<string, any> = new Map()
  private static encryptionKey: string | null = null

  // Garante logger disponível mesmo em early boot; cai para console se serviço não estiver pronto
  private static get log() {
    return (logger as any) ?? console
  }

  constructor(protected app: ApplicationService) {}

  /**
   * Registra o provider no container do AdonisJS
   */
  async register() {
    // Registro tipado via coerção, pois a key não está no ContainerBindings
    this.app.container.singleton('fiscal:manager' as any, () => {
      return {
        loadCertificate: (path: string, password: string) =>
          FiscalProvider.loadCertificate(path, password),
        getCachedCertificate: (identifier: string) =>
          FiscalProvider.getCachedCertificate(identifier),
        clearCache: () => FiscalProvider.clearCache(),
      }
    })
  }

  /**
   * Inicializa o provider
   */
  async boot() {
    // Inicializa chave de criptografia via Env schema (obrigatória)
    const encryptionKey = env.get('FISCAL_ENCRYPTION_KEY')

    if (!encryptionKey) {
      throw new Error('FISCAL_ENCRYPTION_KEY não configurada')
    }

    FiscalProvider.encryptionKey = encryptionKey
  }

  /**
   * Carrega um certificado de forma segura
   */
  static async loadCertificate(certificatePath: string, certificatePassword: string): Promise<any> {
    const cacheKey = `${certificatePath}:${crypto.createHash('sha256').update(certificatePassword).digest('hex')}`

    // Verifica se já está em cache
    if (this.certificateCache.has(cacheKey)) {
      FiscalProvider.log.info({ path: certificatePath }, 'Certificado carregado do cache')
      return this.certificateCache.get(cacheKey)
    }

    try {
      FiscalProvider.log.info({ path: certificatePath }, 'Carregando certificado do disco')

      // Lê o arquivo do certificado
      const pfxBuffer = await fs.readFile(certificatePath)

      // Aqui você processaria o certificado com node-forge
      // Este é um placeholder - em produção, fazer parsing completo do PFX

      const certificateData = {
        path: certificatePath,
        loadedAt: new Date(),
        fingerprint: crypto.createHash('sha256').update(pfxBuffer).digest('hex'),
      }

      // Armazena em cache (limpar periodicamente em produção)
      this.certificateCache.set(cacheKey, certificateData)

      FiscalProvider.log.info({ path: certificatePath }, 'Certificado carregado com sucesso')

      return certificateData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      FiscalProvider.log.error(
        { error: errorMessage, path: certificatePath },
        'Erro ao carregar certificado'
      )
      throw error
    }
  }

  /**
   * Obtém um certificado do cache
   */
  static getCachedCertificate(identifier: string): any | null {
    return this.certificateCache.get(identifier) || null
  }

  /**
   * Limpa o cache de certificados
   */
  static clearCache(): void {
    this.certificateCache.clear()
    FiscalProvider.log.info('Cache de certificados limpo')
  }

  /**
   * Criptografa dados sensíveis (senhas de certificados)
   */
  static encryptSensitiveData(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0')),
      iv
    )

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
  }

  /**
   * Descriptografa dados sensíveis
   */
  static decryptSensitiveData(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }

    const [ivHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0')),
      iv
    )

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}
