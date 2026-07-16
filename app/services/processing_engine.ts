import ProcessingRule from '#models/processing_rule'
import ProcessingEvent from '#models/processing_event'
import EntityProcessingStatus from '#models/entity_processing_status'
import ProcessingHandlerRegistry from '#services/processing_handler_registry'

interface ProcessingResult {
  success: boolean
  entityType: string
  entityId: number
  completedRules: string[]
  failedRules: Array<{ ruleName: string; error: string }>
  details: Array<{
    ruleName: string
    status: 'success' | 'failed'
    error?: string
  }>
}

/**
 * ProcessingEngine
 *
 * Orquestra a execução de regras de processamento para diferentes entidades.
 * Garante que todas as regras críticas sejam executadas e registra cada tentativa.
 */
export default class ProcessingEngine {
  /**
   * Inicializa o processamento de uma entidade
   * Executa todas as regras aplicáveis em ordem de prioridade
   */
  static async processEntity(
    entityType: string,
    entityId: number,
    empresaId: number,
    entity: any,
    userId?: number
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: true,
      entityType,
      entityId,
      completedRules: [],
      failedRules: [],
      details: [],
    }

    try {
      // 1. Buscar ou criar status de processamento
      let status = await EntityProcessingStatus.query()
        .where('entityType', entityType)
        .where('entityId', entityId)
        .first()

      if (!status) {
        status = await EntityProcessingStatus.create({
          empresaId,
          entityType,
          entityId,
          status: 'pending',
        })
      }

      // 2. Buscar todas as regras aplicáveis e habilitadas
      const rules = await ProcessingRule.query()
        .where('empresaId', empresaId)
        .where('enabled', true)
        .where((query) => {
          query.where('appliedTo', entityType).orWhere('appliedTo', 'geral')
        })
        .orderBy('priority', 'desc')

      if (rules.length === 0) {
        // Sem regras aplicáveis
        await status.markAsComplete([])
        return result
      }

      // 3. Executar cada regra
      for (const rule of rules) {
        const processingEvent = await ProcessingEvent.create({
          empresaId,
          processingRuleId: rule.id,
          entityType,
          entityId,
          ruleName: rule.name,
          status: 'pending',
          executedBy: userId || null,
        })

        try {
          await processingEvent.markAsProcessing()

          // Executa o handler da regra
          const ruleResult = await this.executeRuleHandler(rule, entity)

          if (ruleResult.success) {
            await processingEvent.markAsSuccess(ruleResult.data)
            result.completedRules.push(rule.name)
            result.details.push({
              ruleName: rule.name,
              status: 'success',
            })
          } else {
            await processingEvent.markAsFailed(ruleResult.error || 'Erro desconhecido')
            result.failedRules.push({
              ruleName: rule.name,
              error: ruleResult.error || 'Erro desconhecido',
            })
            result.details.push({
              ruleName: rule.name,
              status: 'failed',
              error: ruleResult.error,
            })
            result.success = false
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
          const stackTrace = error instanceof Error ? error.stack : undefined

          await processingEvent.markAsFailed(errorMsg, stackTrace)
          result.failedRules.push({
            ruleName: rule.name,
            error: errorMsg,
          })
          result.details.push({
            ruleName: rule.name,
            status: 'failed',
            error: errorMsg,
          })
          result.success = false
        }
      }

      // 4. Atualizar status baseado nos resultados
      if (result.failedRules.length === 0) {
        await status.markAsComplete(result.completedRules)
      } else if (result.completedRules.length > 0) {
        await status.markAsPartial(result.completedRules, result.failedRules)
      } else {
        await status.markAsFailed(result.failedRules)
      }

      return result
    } catch (error) {
      throw new Error(`Erro ao processar entidade ${entityType}#${entityId}: ${error.message}`)
    }
  }

  /**
   * Reprocessa uma entidade específica
   * Executa apenas as regras selecionadas novamente
   */
  static async reprocessEntity(
    entityType: string,
    entityId: number,
    empresaId: number,
    entity: any,
    ruleIds?: number[],
    userId?: number
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: true,
      entityType,
      entityId,
      completedRules: [],
      failedRules: [],
      details: [],
    }

    try {
      // 1. Buscar status atual
      let status = await EntityProcessingStatus.query()
        .where('entityType', entityType)
        .where('entityId', entityId)
        .first()

      if (!status) {
        status = await EntityProcessingStatus.create({
          empresaId,
          entityType,
          entityId,
          status: 'pending',
        })
      }

      // 2. Buscar regras para reprocessar
      let rules: ProcessingRule[]

      if (ruleIds && ruleIds.length > 0) {
        // Reprocessar apenas regras específicas
        rules = await ProcessingRule.query()
          .where('empresaId', empresaId)
          .where('enabled', true)
          .whereIn('id', ruleIds)
          .orderBy('priority', 'desc')
      } else {
        // Reprocessar todas as regras que falharam
        rules = await ProcessingRule.query()
          .where('empresaId', empresaId)
          .where('enabled', true)
          .where((query) => {
            query.where('appliedTo', entityType).orWhere('appliedTo', 'geral')
          })
          .orderBy('priority', 'desc')
      }

      // 3. Executar cada regra
      const completedBefore = status.completedRules || []

      for (const rule of rules) {
        // Criar novo ProcessingEvent para rastrear esta tentativa
        const processingEvent = await ProcessingEvent.create({
          empresaId,
          processingRuleId: rule.id,
          entityType,
          entityId,
          ruleName: rule.name,
          status: 'pending',
          executedBy: userId || null,
        })

        try {
          await processingEvent.markAsReprocessing()

          const ruleResult = await this.executeRuleHandler(rule, entity)

          if (ruleResult.success) {
            await processingEvent.markAsSuccess(ruleResult.data)
            result.completedRules.push(rule.name)
            result.details.push({
              ruleName: rule.name,
              status: 'success',
            })

            // Adicionar à lista de completadas
            if (!completedBefore.includes(rule.name)) {
              completedBefore.push(rule.name)
            }
          } else {
            await processingEvent.markAsFailed(ruleResult.error || 'Erro desconhecido')
            result.failedRules.push({
              ruleName: rule.name,
              error: ruleResult.error || 'Erro desconhecido',
            })
            result.details.push({
              ruleName: rule.name,
              status: 'failed',
              error: ruleResult.error,
            })
            result.success = false
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
          const stackTrace = error instanceof Error ? error.stack : undefined

          await processingEvent.markAsFailed(errorMsg, stackTrace)
          result.failedRules.push({
            ruleName: rule.name,
            error: errorMsg,
          })
          result.details.push({
            ruleName: rule.name,
            status: 'failed',
            error: errorMsg,
          })
          result.success = false
        }
      }

      // 4. Atualizar status baseado nos resultados
      const allCompleted = [...new Set([...completedBefore, ...result.completedRules])]
      const remainingFailed = result.failedRules

      if (remainingFailed.length === 0) {
        await status.markAsComplete(allCompleted)
      } else if (allCompleted.length > 0) {
        await status.markAsPartial(allCompleted, remainingFailed)
      } else {
        await status.markAsFailed(remainingFailed)
      }

      return result
    } catch (error) {
      throw new Error(`Erro ao reprocessar entidade ${entityType}#${entityId}: ${error.message}`)
    }
  }

  /**
   * Executa o handler de uma regra específica
   * Realiza resolução dinâmica do service e método
   */
  private static async executeRuleHandler(
    rule: ProcessingRule,
    entity: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { serviceName, methodName } = rule.getHandler()

      const registryService = ProcessingHandlerRegistry.resolve(serviceName)

      let serviceInstance = registryService

      if (!serviceInstance) {
        const servicePath = `#services/${this.camelToSnakeCase(serviceName)}`
        let Service

        try {
          Service = await import(servicePath)
          Service = Service.default || Service
        } catch {
          throw new Error(
            `Serviço não encontrado: ${servicePath}. Verifique o handler configurado na regra.`
          )
        }

        serviceInstance = Service
      }

      if (
        typeof serviceInstance === 'function' &&
        typeof serviceInstance[methodName] !== 'function'
      ) {
        serviceInstance = new serviceInstance()
      }

      // Verificar se método existe
      if (typeof serviceInstance[methodName] !== 'function') {
        throw new Error(
          `Método não encontrado: ${serviceName}.${methodName}. Verifique o handler configurado.`
        )
      }

      // Executar o handler
      const result = await serviceInstance[methodName](entity, rule.config || {})

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Converte camelCase para snake_case
   */
  private static camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '')
  }

  /**
   * Obtém o status de processamento de uma entidade
   */
  static async getEntityStatus(entityType: string, entityId: number) {
    const status = await EntityProcessingStatus.query()
      .where('entityType', entityType)
      .where('entityId', entityId)
      .first()

    if (!status) {
      return null
    }

    return status.serialize()
  }

  /**
   * Obtém o histórico de processamento de uma entidade
   */
  static async getEntityHistory(entityType: string, entityId: number, limit: number = 50) {
    return ProcessingEvent.query()
      .where('entityType', entityType)
      .where('entityId', entityId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
  }

  /**
   * Lista todas as entidades com falhas de processamento
   */
  static async getFailedEntities(empresaId: number, entityType?: string, limit: number = 100) {
    let query = EntityProcessingStatus.query()
      .where('empresaId', empresaId)
      .where((q) => {
        q.where('status', 'failed').orWhere('status', 'partial')
      })

    if (entityType) {
      query = query.where('entityType', entityType)
    }

    return query.orderBy('lastProcessedAt', 'desc').limit(limit)
  }

  /**
   * Reprocessa múltiplas entidades em lote
   */
  static async batchReprocess(
    entities: Array<{ entityType: string; entityId: number; entity: any }>,
    empresaId: number,
    userId?: number
  ): Promise<Array<{ entity: string; result: ProcessingResult }>> {
    const results: Array<{ entity: string; result: ProcessingResult }> = []

    for (const { entityType, entityId, entity } of entities) {
      try {
        const result = await this.reprocessEntity(
          entityType,
          entityId,
          empresaId,
          entity,
          undefined,
          userId
        )
        results.push({
          entity: `${entityType}#${entityId}`,
          result,
        })
      } catch (error) {
        results.push({
          entity: `${entityType}#${entityId}`,
          result: {
            success: false,
            entityType,
            entityId,
            completedRules: [],
            failedRules: [
              {
                ruleName: 'Sistema',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
              },
            ],
            details: [],
          },
        })
      }
    }

    return results
  }
}
