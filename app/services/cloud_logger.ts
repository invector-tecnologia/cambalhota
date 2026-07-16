/**
 * CloudLogger - Sistema de logs simples para Cloudflare R2
 *
 * USO:
 * import cloudLogger from '#services/cloud_logger'
 *
 * cloudLogger.info('Usuário logado', { userId: 123 })
 * cloudLogger.error('Erro ao processar pedido', { error: err })
 * cloudLogger.debug('Debug info', { data })
 */

import r2Logger from './r2_logger.js'

interface LogEntry {
  timestamp: string
  level: 'info' | 'error' | 'warn' | 'debug'
  message: string
  data?: any
}

class CloudLogger {
  private buffer: LogEntry[] = []
  private readonly MAX_BUFFER_SIZE = 1000

  /**
   * Log informativo
   */
  info(message: string, data?: any): void {
    this.addLog('info', message, data)
  }

  /**
   * Log de erro
   */
  error(message: string, data?: any): void {
    this.addLog('error', message, data)
  }

  /**
   * Log de aviso
   */
  warn(message: string, data?: any): void {
    this.addLog('warn', message, data)
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any): void {
    this.addLog('debug', message, data)
  }

  /**
   * Adiciona log ao buffer
   */
  private addLog(level: LogEntry['level'], message: string, data?: any): void {
    try {
      const enrichedData = this.enrichData(data)

      // Sempre faz console.log também (não substitui, complementa)
      const consoleMethod = level === 'error' ? console.error : console.log
      consoleMethod(`[${level.toUpperCase()}] ${message}`, enrichedData || '')

      // Log adicional para Heroku em operações críticas
      if (this.isCriticalLog(message)) {
        console.info(`[HEROKU] 🔥 ${message}`, JSON.stringify(enrichedData))

        // ENVIO IMEDIATO ao R2 para logs críticos de auditoria
        r2Logger.sendCriticalLog(level, message, enrichedData).catch((err) => {
          console.error('[CloudLogger] Erro ao enviar log crítico ao R2:', err)
        })
      } else if (this.isOperationLog(message)) {
        // ENVIO IMEDIATO ao R2 para logs de operação CRUD
        r2Logger.sendOperationLog(level, message, enrichedData).catch((err) => {
          console.error('[CloudLogger] Erro ao enviar log de operação ao R2:', err)
        })
      }

      // Adiciona ao buffer para envio futuro (logs não-críticos)
      this.buffer.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        data: enrichedData,
      })

      // Limita tamanho do buffer (remove logs mais antigos)
      if (this.buffer.length > this.MAX_BUFFER_SIZE) {
        this.buffer = this.buffer.slice(-this.MAX_BUFFER_SIZE)
      }
    } catch (err) {
      // Nunca deve crashear - apenas ignora erro
      console.error('CloudLogger: Falha ao adicionar log', err)
    }
  }

  /**
   * Verifica se é um log crítico que merece destaque no Heroku
   */
  private isCriticalLog(message: string): boolean {
    const criticalPatterns = [
      'FISCAL_', // Operações fiscais
      'LOGIN_SUCCESS',
      'REGISTER_SUCCESS',
      'CAIXA_OPENED',
      'CAIXA_CLOSED',
    ]
    return criticalPatterns.some((pattern) => message.includes(pattern))
  }

  /**
   * Verifica se é um log de operação CRUD
   */
  private isOperationLog(message: string): boolean {
    const operationPatterns = [
      '_CREATED',
      '_UPDATED',
      '_DELETED',
      '_CREATE_FAILED',
      '_UPDATE_FAILED',
      '_DELETE_FAILED',
    ]
    return operationPatterns.some((pattern) => message.includes(pattern))
  }

  private enrichData(data?: any): any {
    if (!data) {
      return {
        _meta: this.buildMeta(),
      }
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      return {
        value: data,
        _meta: this.buildMeta(),
      }
    }

    return {
      ...data,
      _meta: this.buildMeta(),
    }
  }

  private buildMeta(): { environment?: string; appName?: string; pid?: number } {
    return {
      environment: process.env.NODE_ENV,
      appName: process.env.APP_NAME,
      pid: process.pid,
    }
  }

  /**
   * Retorna logs atuais e limpa buffer (usado pelo worker)
   */
  flush(): LogEntry[] {
    const logs = [...this.buffer]
    this.buffer = []
    return logs
  }

  /**
   * Retorna quantidade de logs no buffer
   */
  getBufferSize(): number {
    return this.buffer.length
  }
}

// Singleton
const cloudLogger = new CloudLogger()
export default cloudLogger
