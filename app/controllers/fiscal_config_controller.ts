import { HttpContext } from '@adonisjs/core/http'
import FiscalConfig from '#models/fiscal_config'
import FiscalNote from '#models/fiscal_note'
import FiscalCertificateUploader from '#services/fiscal_certificate_uploader'
import logger from '@adonisjs/core/services/logger'

/**
 * Controller para configuração fiscal (UI Web)
 */
export default class FiscalConfigController {
  /**
   * GET /config/fiscal - Página de visualização da configuração fiscal
   */
  async showConfigPage({ view, auth, response, session }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

      return view.render('fiscal/config/index', { config })
    } catch (error) {
      logger.error({ error }, 'Erro ao carregar configuração fiscal')
      session.flash('error', 'Erro ao carregar configuração fiscal')
      return response.redirect().toRoute('dashboard.index')
    }
  }

  /**
   * GET /config/fiscal/create - Página de criação de configuração fiscal
   */
  async createConfigPage({ view }: HttpContext) {
    return view.render('fiscal/config/form', { config: null })
  }

  /**
   * GET /config/fiscal/edit - Página de edição de configuração fiscal
   */
  async editConfigPage({ view, auth, response, session }: HttpContext) {
    const user = await auth.authenticate()
    const establishmentId = (user as any).establishment_id || (user as any).empresaId

    const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

    if (!config) {
      session.flash('error', 'Configuração fiscal não encontrada')
      return response.redirect().toRoute('fiscal.config.page.index')
    }

    return view.render('fiscal/config/form', { config })
  }

  /**
   * POST /config/fiscal - Cria configuração fiscal via form
   */
  async storeConfigPage({ request, response, auth, session }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const existingConfig = await FiscalConfig.query()
        .where('establishment_id', establishmentId)
        .first()

      if (existingConfig) {
        session.flash('error', 'Já existe uma configuração fiscal para este estabelecimento')
        return response.redirect().toRoute('fiscal.config.page.index')
      }

      const certificate = request.file('certificate', {
        size: '5mb',
        extnames: ['pfx', 'p12'],
      })

      if (!certificate) {
        session.flash('error', 'Certificado digital é obrigatório')
        return response.redirect().back()
      }

      await user.load('empresa')
      const cnpj = (user as any).empresa?.cnpj || (user as any).cnpj || ''
      const certificatePath = await FiscalCertificateUploader.uploadFromRequest(
        certificate,
        establishmentId,
        cnpj
      )

      const config = new FiscalConfig()
      config.establishmentId = establishmentId
      config.certificatePath = certificatePath
      config.certificatePassword = request.input('certificate_password')
      config.cscToken = request.input('csc_token')
      config.cscId = request.input('csc_id')
      config.isHomologation = request.input('is_homologation') === 'true'

      await config.save()

      session.flash('success', 'Configuração fiscal criada com sucesso!')
      return response.redirect().toRoute('fiscal.config.page.index')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao criar configuração')
      session.flash('error', `Erro ao criar configuração: ${errorMessage}`)
      return response.redirect().back()
    }
  }

  /**
   * PUT /config/fiscal - Atualiza configuração fiscal via form
   */
  async updateConfigPage({ request, response, auth, session }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

      if (!config) {
        session.flash('error', 'Configuração fiscal não encontrada')
        return response.redirect().toRoute('fiscal.config.page.index')
      }

      const certificate = request.file('certificate', {
        size: '5mb',
        extnames: ['pfx', 'p12'],
      })

      if (certificate) {
        await user.load('empresa')
        const cnpj = (user as any).empresa?.cnpj || (user as any).cnpj || ''
        config.certificatePath = await FiscalCertificateUploader.uploadFromRequest(
          certificate,
          establishmentId,
          cnpj
        )
      }

      const certificatePassword = request.input('certificate_password')
      if (certificatePassword) {
        config.certificatePassword = certificatePassword
      }

      config.cscToken = request.input('csc_token')
      config.cscId = request.input('csc_id')
      config.isHomologation = request.input('is_homologation') === 'true'

      const nextNfeNumber = request.input('next_nfe_number')
      if (nextNfeNumber) {
        config.nextNfeNumber = Number(nextNfeNumber)
      }

      await config.save()

      session.flash('success', 'Configuração fiscal atualizada com sucesso!')
      return response.redirect().toRoute('fiscal.config.page.index')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error(
        { error: errorMessage, stack: error instanceof Error ? error.stack : undefined },
        'Erro ao atualizar configuração'
      )
      session.flash('error', `Erro ao atualizar configuração: ${errorMessage}`)
      return response.redirect().back()
    }
  }

  /**
   * GET /api/fiscal/suggest-next-number - Sugere próximo número de NF-e
   * Consulta o maior número já emitido (AUTHORIZED ou PENDING) e retorna +1
   */
  async suggestNextNumber({ auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()
      if (!config) {
        return response.json({ error: 'Configuração fiscal não encontrada' })
      }

      // Busca o maior número de nota já usada para este estabelecimento
      const maxNote = await FiscalNote.query()
        .where('fiscal_config_id', config.id)
        .whereIn('status', ['AUTHORIZED', 'PENDING', 'ERROR'])
        .whereNotNull('numero')
        .orderBy('numero', 'desc')
        .first()

      const maxNumero = maxNote?.numero ?? 0
      const suggestedNumber = maxNumero + 1

      // Garante que o sugerido é pelo menos o atual configurado
      const finalNumber = Math.max(suggestedNumber, config.nextNfeNumber || 1)

      logger.info(
        { establishmentId, maxNumero, suggestedNumber: finalNumber },
        '[FISCAL_CONFIG] SUGGEST_NEXT_NUMBER'
      )

      return response.json({
        suggestedNumber: finalNumber,
        maxNumero,
        currentConfigNumber: config.nextNfeNumber,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao sugerir próximo número')
      return response.status(500).json({ error: errorMessage })
    }
  }

  /**
   * DELETE /config/fiscal - Deleta configuração fiscal via form
   */
  async destroyConfigPage({ response, auth, session }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const establishmentId = (user as any).establishment_id || (user as any).empresaId

      const config = await FiscalConfig.query().where('establishment_id', establishmentId).first()

      if (!config) {
        session.flash('error', 'Configuração fiscal não encontrada')
        return response.redirect().toRoute('fiscal.config.page.index')
      }

      await config.delete()

      session.flash('success', 'Configuração fiscal excluída com sucesso!')
      return response.redirect().toRoute('fiscal.config.page.index')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      logger.error({ error: errorMessage }, 'Erro ao excluir configuração')
      session.flash('error', `Erro ao excluir configuração: ${errorMessage}`)
      return response.redirect().back()
    }
  }
}
