/**
 * VoiceConfigController — CRUD de configuração BYOK para voz.
 * Telas: /configuracoes/voz (view), /configuracoes/voz (update)
 */
import type { HttpContext } from '@adonisjs/core/http'
import VoiceConfig from '#models/voice_config'
import voiceConfig from '#config/voice'

export default class VoiceConfigController {
  /**
   * Exibe página de configuração de voz.
   * GET /configuracoes/voz
   */
  async edit({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const config = await VoiceConfig.query().where('empresa_id', user.empresa.id).first()

    return view.render('configuracoes/voz', {
      empresa: user.empresa.serialize(),
      voiceConfig: config
        ? {
            enabled: config.enabled,
            maskedKey: config.maskedApiKey,
            hasKey: !!config.openaiApiKeyEncrypted,
            whisperModel: config.whisperModel || voiceConfig.whisperModel,
            llmModel: config.llmModel || voiceConfig.llmModel,
          }
        : null,
      serverEnabled: voiceConfig.enabled,
    })
  }

  /**
   * Atualiza configuração de voz.
   * POST /configuracoes/voz
   */
  async update({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const openaiApiKey = String(request.input('openaiApiKey', '')).trim()
    const whisperModel = String(request.input('whisperModel', '')).trim() || null
    const llmModel = String(request.input('llmModel', '')).trim() || null

    // O checkbox + hidden envia array ['false','true'] quando marcado, ou 'false' quando desmarcado
    const enabledRaw = request.input('enabled')
    const enabled = Array.isArray(enabledRaw)
      ? enabledRaw.includes('true') || enabledRaw.includes('1')
      : enabledRaw === true || enabledRaw === 'true' || enabledRaw === '1'

    logger.info(
      { empresaId: user.empresa.id, hasKey: openaiApiKey.length > 0, enabled },
      'VOICE_CONFIG_UPDATE_ATTEMPT'
    )

    try {
      let config = await VoiceConfig.query().where('empresa_id', user.empresa.id).first()

      // Se não existe config ainda, exigir API key
      if (!config && openaiApiKey.length === 0) {
        session.flash('error', 'Informe a API Key da OpenAI para criar a configuração.')
        return response.redirect().back()
      }

      if (!config) {
        config = new VoiceConfig()
        config.empresaId = user.empresa.id
      }

      // Atualizar API key apenas se fornecida (não sobrescrever com vazio)
      if (openaiApiKey.length > 0) {
        config.setApiKey(openaiApiKey)
        logger.info({ empresaId: user.empresa.id }, 'VOICE_API_KEY_SET')
      }

      config.enabled = enabled
      config.whisperModel = whisperModel
      config.llmModel = llmModel

      await config.save()

      logger.info(
        { empresaId: user.empresa.id, configId: config.id, enabled: config.enabled },
        'VOICE_CONFIG_UPDATED'
      )

      session.flash('success', 'Configuração de voz atualizada com sucesso!')
    } catch (error: any) {
      logger.error(
        { error: error.message, empresaId: user.empresa.id },
        'VOICE_CONFIG_UPDATE_ERROR'
      )
      session.flash('error', `Erro ao salvar configuração: ${error.message}`)
    }

    return response.redirect().back()
  }

  /**
   * Testa a API key fazendo uma chamada simples à OpenAI.
   * POST /configuracoes/voz/testar
   */
  async testKey({ auth, response, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const config = await VoiceConfig.query().where('empresa_id', user.empresa.id).first()

    if (!config || !config.openaiApiKeyEncrypted) {
      return response.status(400).json({
        success: false,
        error: 'Nenhuma API key configurada.',
      })
    }

    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey: config.getApiKey() })

      // Teste rápido: listar modelos
      const models = await client.models.list()
      const hasWhisper = models.data.some((m: any) => m.id.includes('whisper'))
      const hasGpt = models.data.some((m: any) => m.id.includes('gpt'))

      logger.info(
        { empresaId: user.empresa.id, modelsCount: models.data.length },
        'VOICE_KEY_TEST_OK'
      )

      return response.json({
        success: true,
        data: {
          valid: true,
          hasWhisper,
          hasGpt,
          message: 'API key válida! Modelos Whisper e GPT disponíveis.',
        },
      })
    } catch (error: any) {
      logger.error({ error: error.message }, 'VOICE_KEY_TEST_FAIL')
      return response.json({
        success: false,
        error: `API key inválida: ${error.message}`,
      })
    }
  }
}
