import type { HttpContext } from '@adonisjs/core/http'
import ProcessingEngine from '#services/processing_engine'
import ProcessingRule from '#models/processing_rule'
import ProcessingEvent from '#models/processing_event'
import EntityProcessingStatus from '#models/entity_processing_status'
import Pedido from '#models/pedido'
import Venda from '#models/venda'
import Comanda from '#models/comanda'
import Nfe from '#models/nfe'
import vine from '@vinejs/vine'

export default class ProcessingAdminController {
  /**
   * Dashboard principal de reprocessamento
   * Lista entidades com falhas de processamento
   */
  async dashboard({ view, request, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    logger.info(`[PROCESSING DASHBOARD] User ${user.id} accessing processing dashboard`)

    const page = request.input('page', 1)
    const entityType = request.input('entity_type', '')
    const status = request.input('status', '')
    const search = request.input('search', '')

    let query = EntityProcessingStatus.query()
      .where('empresa_id', user.empresaId)
      .where((q) => {
        q.where('status', 'failed').orWhere('status', 'partial')
      })

    if (entityType) {
      query = query.where('entityType', entityType)
    }

    if (status) {
      query = query.where('status', status)
    }

    // Buscar também por ID da entidade
    if (search) {
      query = query.where('entityId', 'ilike', `%${search}%`)
    }

    const failedEntities = await query.orderBy('lastProcessedAt', 'desc').paginate(page, 20)

    // Enriquecer dados com informações da entidade
    const enrichedEntities = await Promise.all(
      failedEntities.all().map(async (statusRecord) => {
        const data = statusRecord.serialize()
        try {
          const entity = await this.getEntity(statusRecord.entityType, statusRecord.entityId)
          data.entity = entity
        } catch (error) {
          data.entity = null
        }
        return data
      })
    )

    return view.render('admin/processing/dashboard', {
      failedEntities: enrichedEntities,
      pagination: failedEntities.getMeta(),
      filters: { entityType, status, search },
    })
  }

  /**
   * Detalhes de reprocessamento para uma entidade específica
   */
  async show({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()

    const processingStatus = await EntityProcessingStatus.query()
      .where('empresa_id', user.empresaId)
      .where('entityType', params.entityType)
      .where('entityId', params.entityId)
      .firstOrFail()

    const processingEvents = await ProcessingEvent.query()
      .where('entityType', params.entityType)
      .where('entityId', params.entityId)
      .orderBy('createdAt', 'desc')

    // Carregar entidade
    const entity = await this.getEntity(params.entityType, params.entityId)

    // Carregar rules aplicáveis
    const applicableRules = await ProcessingRule.query()
      .where('empresa_id', user.empresaId)
      .where('enabled', true)
      .where((q) => {
        q.where('appliedTo', params.entityType).orWhere('appliedTo', 'geral')
      })
      .orderBy('priority', 'desc')

    return view.render('admin/processing/show', {
      processingStatus: processingStatus.serialize(),
      processingEvents: processingEvents.map((e) => e.serialize()),
      entity,
      entityType: params.entityType,
      entityId: params.entityId,
      applicableRules: applicableRules.map((r) => r.serialize()),
    })
  }

  /**
   * Reprocessa uma entidade específica
   */
  async reprocess({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    try {
      logger.info(
        `[PROCESSING REPROCESS] User ${user.id} requesting reprocess for ${params.entityType}#${params.entityId}`
      )

      // Validar dados
      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            ruleIds: vine.array(vine.number()).optional(),
          })
        )
      )

      // Buscar entidade
      const entity = await this.getEntity(params.entityType, params.entityId)
      if (!entity) {
        session.flash('error', `Entidade ${params.entityType}#${params.entityId} não encontrada`)
        return response.redirect().back()
      }

      // Executar reprocessamento
      const result = await ProcessingEngine.reprocessEntity(
        params.entityType,
        params.entityId,
        user.empresaId,
        entity,
        data.ruleIds,
        user.id
      )

      logger.info(
        `[PROCESSING REPROCESS] SUCCESS | ${params.entityType}#${params.entityId} | Completed: ${result.completedRules.length} | Failed: ${result.failedRules.length}`
      )

      if (result.success) {
        session.flash(
          'success',
          `Reprocessamento concluído! ${result.completedRules.length} regra(s) executada(s) com sucesso.`
        )
      } else {
        session.flash(
          'warning',
          `Reprocessamento concluído com erro(s). ${result.completedRules.length} regra(s) passou, ${result.failedRules.length} falhou.`
        )
      }

      return response.redirect().toRoute('processing.show', {
        entityType: params.entityType,
        entityId: params.entityId,
      })
    } catch (error) {
      logger.error(
        `[PROCESSING REPROCESS] ERROR | ${params.entityType}#${params.entityId} | ${error.message}`
      )
      session.flash('error', `Erro ao reprocessar: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Reprocessamento em lote
   */
  async batchReprocess({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    try {
      logger.info(`[PROCESSING BATCH] User ${user.id} requesting batch reprocess`)

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            entityType: vine.string().optional(),
            status: vine.string().optional(),
            ruleIds: vine.array(vine.number()).optional(),
          })
        )
      )

      // Buscar entidades para reprocessar
      let query = EntityProcessingStatus.query()
        .where('empresa_id', user.empresaId)
        .where((q) => {
          q.where('status', 'failed').orWhere('status', 'partial')
        })

      if (data.entityType) {
        query = query.where('entityType', data.entityType)
      }

      if (data.status) {
        query = query.where('status', data.status)
      }

      const statusRecords = await query.limit(50) // Limitar para 50 de cada vez

      // Preparar entidades para reprocessamento
      const entitiesToReprocess: Array<{ entityType: string; entityId: number; entity: any }> = []

      for (const status of statusRecords) {
        try {
          const entity = await this.getEntity(status.entityType, status.entityId)
          if (entity) {
            entitiesToReprocess.push({
              entityType: status.entityType,
              entityId: status.entityId,
              entity,
            })
          }
        } catch (error) {
          logger.error(
            `[PROCESSING BATCH] Error loading entity ${status.entityType}#${status.entityId}: ${error.message}`
          )
        }
      }

      // Executar reprocessamento em lote
      const results = await ProcessingEngine.batchReprocess(
        entitiesToReprocess,
        user.empresaId,
        user.id
      )

      const successCount = results.filter((r) => r.result.success).length
      const failCount = results.length - successCount

      logger.info(
        `[PROCESSING BATCH] SUCCESS | Processed ${results.length} entities | Success: ${successCount} | Failed: ${failCount}`
      )

      session.flash(
        'success',
        `Reprocessamento em lote concluído! ${successCount} entidade(s) sucesso, ${failCount} com erro.`
      )
      return response.redirect().toRoute('processing.dashboard')
    } catch (error) {
      logger.error(`[PROCESSING BATCH] ERROR | ${error.message}`)
      session.flash('error', `Erro ao executar reprocessamento em lote: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * CRUD de Processing Rules
   */
  async rulesIndex({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()

    const page = request.input('page', 1)
    const type = request.input('type', '')
    const enabled = request.input('enabled', '')

    let query = ProcessingRule.query().where('empresa_id', user.empresaId)

    if (type) {
      query = query.where('type', type)
    }

    if (enabled !== '') {
      query = query.where('enabled', enabled === 'true')
    }

    const rules = await query.orderBy('priority', 'desc').paginate(page, 20)

    return view.render('admin/processing/rules_index', {
      rules: rules.serialize(),
      pagination: rules.getMeta(),
      filters: { type, enabled },
    })
  }

  /**
   * Criar nova regra
   */
  async createRule({ view, auth }: HttpContext) {
    await auth.authenticate()
    return view.render('admin/processing/rule_form', {
      rule: null,
      types: [
        'stock_reservation',
        'stock_deduction',
        'discount_apply',
        'nfe_emit',
        'comanda_closing',
        'pedido_status_sync',
        'custom',
      ],
      appliedTo: ['pedido', 'venda', 'comanda', 'nfe', 'geral'],
    })
  }

  /**
   * Salvar regra
   */
  async storeRule({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    try {
      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            name: vine.string().minLength(3),
            type: vine.string(),
            appliedTo: vine.string(),
            handler: vine.string().minLength(5),
            priority: vine.number().min(0).max(100),
            enabled: vine.boolean(),
            description: vine.string().optional(),
            config: vine.string().optional(),
          })
        )
      )

      const config = data.config ? JSON.parse(data.config) : null

      const rule = await ProcessingRule.create({
        empresaId: user.empresaId,
        name: data.name,
        type: data.type as any,
        appliedTo: data.appliedTo as any,
        handler: data.handler,
        priority: data.priority,
        enabled: data.enabled,
        description: data.description || null,
        config,
      })

      logger.info(`[PROCESSING RULE] Rule created: ${rule.id} | ${rule.name} | by user ${user.id}`)
      session.flash('success', 'Regra criada com sucesso!')
      return response.redirect().toRoute('processing.rulesIndex')
    } catch (error) {
      logger.error(`[PROCESSING RULE] Error creating rule: ${error.message}`)
      session.flash('error', `Erro ao criar regra: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Editar regra
   */
  async editRule({ params, view, auth }: HttpContext) {
    const user = await auth.authenticate()
    const rule = await ProcessingRule.query()
      .where('empresa_id', user.empresaId)
      .where('id', params.id)
      .firstOrFail()

    return view.render('admin/processing/rule_form', {
      rule: rule.serialize(),
      types: [
        'stock_reservation',
        'stock_deduction',
        'discount_apply',
        'nfe_emit',
        'comanda_closing',
        'pedido_status_sync',
        'custom',
      ],
      appliedTo: ['pedido', 'venda', 'comanda', 'nfe', 'geral'],
    })
  }

  /**
   * Atualizar regra
   */
  async updateRule({ params, request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    try {
      const rule = await ProcessingRule.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            name: vine.string().minLength(3),
            type: vine.string(),
            appliedTo: vine.string(),
            handler: vine.string().minLength(5),
            priority: vine.number().min(0).max(100),
            enabled: vine.boolean(),
            description: vine.string().optional(),
            config: vine.string().optional(),
          })
        )
      )

      const config = data.config ? JSON.parse(data.config) : null

      rule.name = data.name
      rule.type = data.type as any
      rule.appliedTo = data.appliedTo as any
      rule.handler = data.handler
      rule.priority = data.priority
      rule.enabled = data.enabled
      rule.description = data.description || null
      rule.config = config

      await rule.save()

      logger.info(`[PROCESSING RULE] Rule updated: ${rule.id} | ${rule.name} | by user ${user.id}`)
      session.flash('success', 'Regra atualizada com sucesso!')
      return response.redirect().toRoute('processing.rulesIndex')
    } catch (error) {
      logger.error(`[PROCESSING RULE] Error updating rule: ${error.message}`)
      session.flash('error', `Erro ao atualizar regra: ${error.message}`)
      return response.redirect().back()
    }
  }

  /**
   * Deletar regra
   */
  async deleteRule({ params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()

    try {
      const rule = await ProcessingRule.query()
        .where('empresa_id', user.empresaId)
        .where('id', params.id)
        .firstOrFail()

      const ruleName = rule.name
      await rule.delete()

      logger.info(`[PROCESSING RULE] Rule deleted: ${rule.id} | ${ruleName} | by user ${user.id}`)
      session.flash('success', 'Regra deletada com sucesso!')
      return response.redirect().toRoute('processing.rulesIndex')
    } catch (error) {
      logger.error(`[PROCESSING RULE] Error deleting rule: ${error.message}`)
      session.flash('error', `Erro ao deletar regra: ${error.message}`)
      return response.redirect().back()
    }
  }

  // Helpers
  private async getEntity(entityType: string, entityId: number) {
    switch (entityType) {
      case 'Pedido':
        return Pedido.findOrFail(entityId)
      case 'Venda':
        return Venda.findOrFail(entityId)
      case 'Comanda':
        return Comanda.findOrFail(entityId)
      case 'Nfe':
        return Nfe.findOrFail(entityId)
      default:
        throw new Error(`Tipo de entidade desconhecido: ${entityType}`)
    }
  }
}
