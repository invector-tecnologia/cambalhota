import env from '#start/env'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

interface BatchedLog {
  timestamp: string
  level: string
  message: string
  data?: any
}

interface LogBatch {
  logs: BatchedLog[]
  timer: NodeJS.Timeout | null
  cnpj: string | null
  operationKey: string
  createdAt: number
}

export function buildBatchKey(
  folder: string,
  cnpj: string | null,
  operationId: string | null,
  message: string
): string {
  const operationType = getOperationType(message)
  return `${folder}:${cnpj || 'no-cnpj'}:${operationId || operationType}`
}

function getOperationType(message: string): string {
  if (message.startsWith('FISCAL_')) return 'FISCAL'
  if (message.startsWith('LOGIN_')) return 'LOGIN'
  if (message.startsWith('CAIXA_')) return 'CAIXA'
  if (message.startsWith('REGISTER_')) return 'REGISTER'
  return 'OTHER'
}

/**
 * R2Logger - Agrupa logs relacionados em um único arquivo
 * Logs da mesma operação (vendaId/CNPJ) são agrupados por 2 segundos
 */
class R2Logger {
  private s3Client: S3Client | null = null
  private bucket: string | null = null
  private isConfigured = false
  private batches: Map<string, LogBatch> = new Map()
  private readonly BATCH_TIMEOUT_MS = 2000 // 2 segundos para agrupar logs
  private readonly MAX_BATCH_WINDOW_MS = 15000 // Limite para consolidar log em arquivo unico

  constructor() {
    this.initializeClient()
  }

  private initializeClient(): void {
    try {
      const bucket = env.get('R2_BUCKET')
      const accountId = env.get('R2_ACCOUNT_ID')
      const accessKeyId = env.get('R2_ACCESS_KEY_ID')
      const secretAccessKey = env.get('R2_SECRET_ACCESS_KEY')
      const endpoint = env.get('R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`

      if (!bucket || !accessKeyId || !secretAccessKey) {
        console.warn('[R2Logger] Configuração R2 incompleta - logs não serão enviados')
        return
      }

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      this.bucket = bucket
      this.isConfigured = true
      console.info(
        '[R2Logger] Cliente R2 inicializado - logs críticos serão enviados imediatamente'
      )
    } catch (error) {
      console.error('[R2Logger] Erro ao inicializar cliente:', error)
    }
  }

  /**
   * Envia log crítico com agrupamento por operação
   */
  async sendCriticalLog(level: string, message: string, data?: any): Promise<void> {
    return this.addToBatch('critical', level, message, data)
  }

  /**
   * Envia log de operação CRUD com agrupamento
   */
  async sendOperationLog(level: string, message: string, data?: any): Promise<void> {
    return this.addToBatch('operation', level, message, data)
  }

  /**
   * Adiciona log a um batch agrupado por operação
   */
  private async addToBatch(
    folder: string,
    level: string,
    message: string,
    data?: any
  ): Promise<void> {
    if (!this.isConfigured || !this.s3Client || !this.bucket) {
      return
    }

    try {
      const timestamp = new Date()
      const cnpj = this.extractCNPJ(data)
      const operationId = this.extractOperationId(data)

      // Gerar chave única para agrupar logs relacionados
      const batchKey = this.generateBatchKey(folder, cnpj, operationId, message)

      // Criar ou atualizar batch
      const nowMs = Date.now()
      let batch = this.batches.get(batchKey)
      if (!batch) {
        batch = {
          logs: [],
          timer: null,
          cnpj,
          operationKey: batchKey,
          createdAt: nowMs,
        }
        this.batches.set(batchKey, batch)
      }

      // Adicionar log ao batch
      batch.logs.push({
        timestamp: timestamp.toISOString(),
        level,
        message,
        data,
      })

      // Cancelar timer anterior e criar novo
      if (batch.timer) {
        clearTimeout(batch.timer)
      }

      // Se log final ou expirou janela, envia imediatamente
      if (this.shouldFlushNow(message) || nowMs - batch.createdAt >= this.MAX_BATCH_WINDOW_MS) {
        if (batch.timer) {
          clearTimeout(batch.timer)
        }
        await this.flushBatch(batchKey, folder)
        return
      }

      // Agendar envio do batch após timeout
      batch.timer = setTimeout(() => {
        this.flushBatch(batchKey, folder)
      }, this.BATCH_TIMEOUT_MS)
    } catch (error) {
      console.error(`[R2Logger] Erro ao adicionar log ao batch:`, error)
    }
  }

  /**
   * Envia batch de logs para o R2
   */
  private async flushBatch(batchKey: string, folder: string): Promise<void> {
    const batch = this.batches.get(batchKey)
    if (!batch || batch.logs.length === 0) {
      return
    }

    if (!this.bucket) {
      return
    }

    try {
      const firstLog = batch.logs[0]
      const timestamp = new Date(firstLog.timestamp)

      // Gerar nome de arquivo único baseado no primeiro log
      const cnpjPrefix = batch.cnpj ? `${batch.cnpj}-` : ''
      const operationSuffix = this.getOperationSuffix(batch.logs)

      const key = `logs/${folder}/${timestamp.getFullYear()}/${String(timestamp.getMonth() + 1).padStart(2, '0')}/${timestamp.toISOString()}-${cnpjPrefix}${operationSuffix}.json`

      // Criar objeto com múltiplos logs
      const logEntry = {
        batchTimestamp: new Date().toISOString(),
        logsCount: batch.logs.length,
        cnpj: batch.cnpj || null,
        environment: env.get('NODE_ENV'),
        appName: env.get('APP_NAME', 'tavolo'),
        logs: batch.logs,
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(logEntry, null, 2),
        ContentType: 'application/json',
      })

      await this.s3Client!.send(command)
      console.info(`[HEROKU] ⚡ Batch de ${batch.logs.length} log(s) ${folder} enviado → ${key}`)

      // Remover batch da memória
      this.batches.delete(batchKey)
    } catch (error) {
      console.error(`[HEROKU] ❌ Falha ao enviar batch ${folder}:`, error)
      this.batches.delete(batchKey)
    }
  }

  /**
   * Gera chave única para agrupar logs relacionados
   */
  private generateBatchKey(
    folder: string,
    cnpj: string | null,
    operationId: string | null,
    message: string
  ): string {
    return buildBatchKey(folder, cnpj, operationId, message)
  }

  /**
   * Extrai ID da operação dos dados (vendaId, pedidoId, etc)
   */
  private extractOperationId(data?: any): string | null {
    if (!data) return null

    const possibleIds = [
      'fiscalNoteId',
      'vendaId',
      'pedidoId',
      'comandaId',
      'notaFiscalId',
      'accessKey',
      'protocolNumber',
      'userId',
      'caixaId',
    ]

    for (const field of possibleIds) {
      if (data[field]) {
        return `${field}:${data[field]}`
      }
    }

    return null
  }

  /**
   * Identifica tipo de operação baseado no message
   */
  private shouldFlushNow(message: string): boolean {
    const terminalMessages = [
      'FISCAL_AUTHORIZED',
      'FISCAL_EMIT_FAILED',
      'FISCAL_TRANSMIT_ERROR',
      'FISCAL_SEFAZ_RESPONSE_ERROR',
      'FISCAL_CANCEL_SUCCESS',
      'FISCAL_CANCEL_EXCEPTION',
      'FISCAL_XML_PREVALIDATION_FAILED',
      'FISCAL_XSD_INVALID',
      'FISCAL_XSD_INFRA_FALLBACK',
    ]
    return terminalMessages.some((pattern) => message.includes(pattern))
  }

  /**
   * Gera sufixo do nome do arquivo baseado nos logs do batch
   */
  private getOperationSuffix(logs: BatchedLog[]): string {
    const messages = logs.map((l) => l.message)
    const uniqueMessages = [...new Set(messages)]

    if (uniqueMessages.length === 1) {
      return uniqueMessages[0].replace(/[^a-zA-Z0-9_-]/g, '_')
    }

    // Múltiplos tipos de log - usar o primeiro e adicionar sufixo
    const firstMessage = uniqueMessages[0].replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${firstMessage}_and_${logs.length - 1}_more`
  }

  /**
   * Extrai CNPJ dos dados do log
   * Busca em vários campos possíveis: cnpj, empresaCnpj, empresa.cnpj, etc.
   */
  private extractCNPJ(data?: any): string | null {
    if (!data) return null

    // Tentar vários campos possíveis
    const possibleFields = ['cnpj', 'empresaCnpj', 'empresa_cnpj', 'companyDocument', 'document']

    for (const field of possibleFields) {
      if (data[field]) {
        return String(data[field]).replace(/\D/g, '') // Remove formatação
      }
    }

    // Tentar em objeto nested empresa
    if (data.empresa && data.empresa.cnpj) {
      return String(data.empresa.cnpj).replace(/\D/g, '')
    }

    return null
  }

  /**
   * Verifica se é um log crítico de auditoria
   */
  isCriticalLog(message: string): boolean {
    const criticalPatterns = [
      'FISCAL_EMIT_START',
      'FISCAL_AUTHORIZED',
      'FISCAL_EMIT_FAILED',
      'FISCAL_CANCEL_SUCCESS',
      'FISCAL_CANCEL_EXCEPTION',
      'LOGIN_SUCCESS',
      'LOGIN_INACTIVE_USER',
      'LOGIN_INACTIVE_COMPANY',
      'LOGIN_FAILED',
      'REGISTER_SUCCESS',
      'REGISTER_FAILED',
      'CAIXA_OPENED',
      'CAIXA_CLOSED',
      'CAIXA_OPEN_FAILED',
      'CAIXA_CLOSE_FAILED',
    ]
    return criticalPatterns.some((pattern) => message.includes(pattern))
  }
}

// Singleton
const r2Logger = new R2Logger()
export default r2Logger
