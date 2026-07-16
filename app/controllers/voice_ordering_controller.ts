/**
 * VoiceOrderingController — Endpoints para o pipeline de voz.
 * Fluxo:
 *   1. POST /api/voice/preview → transcreve + NLU (retorna preview)
 *   2. POST /api/voice/confirm → executa ações confirmadas
 */
import type { HttpContext } from '@adonisjs/core/http'
import VoiceOrderingService from '#services/voice_ordering_service'
import voiceConfig from '#config/voice'

export default class VoiceOrderingController {
  /**
   * Renderiza a página principal de pedidos por voz.
   * GET /voz
   */
  async page({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const { default: VoiceConfigModel } = await import('#models/voice_config')
    const config = await VoiceConfigModel.query().where('empresa_id', user.empresa.id).first()

    return view.render('voice/index', {
      empresa: user.empresa.serialize(),
      voiceEnabled: voiceConfig.enabled && (config?.enabled || false),
      configured: !!config?.openaiApiKeyEncrypted,
      maxAudioSeconds: voiceConfig.maxAudioSeconds,
    })
  }

  /**
   * Envia áudio e recebe preview das ações interpretadas (sem executar).
   * POST /api/voice/preview
   * Body: multipart com campo "audio" (webm/ogg/mp3)
   */
  async preview({ request, auth, response, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    // Verificar feature flag
    if (!voiceConfig.enabled) {
      return response.status(403).json({
        success: false,
        error: 'Módulo de voz desabilitado no servidor.',
      })
    }

    // Obter arquivo de áudio
    const audioFile = request.file('audio', {
      size: `${voiceConfig.maxFileSizeMb}mb`,
      extnames: ['webm', 'ogg', 'mp3', 'wav', 'm4a', 'mp4'],
    })

    if (!audioFile) {
      return response.status(400).json({
        success: false,
        error: 'Arquivo de áudio não recebido.',
      })
    }

    if (audioFile.hasErrors) {
      return response.status(400).json({
        success: false,
        error: audioFile.errors[0]?.message || 'Arquivo de áudio inválido.',
      })
    }

    try {
      // Ler o buffer do arquivo temporário
      const fs = await import('node:fs/promises')
      const audioBuffer = await fs.readFile(audioFile.tmpPath!)
      const filename = audioFile.clientName || 'audio.webm'

      logger.info(
        { size: audioBuffer.length, filename, empresaId: user.empresa.id },
        'VOICE_PREVIEW_REQUEST'
      )

      const result = await VoiceOrderingService.preview(audioBuffer, filename, user.empresa.id)

      return response.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error: error.message }, 'VOICE_PREVIEW_ERROR')
      return response.status(422).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * Confirma e executa as ações do preview.
   * POST /api/voice/confirm
   * Body JSON: { actions: ParsedVoiceAction[] }
   */
  async confirm({ request, auth, response, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    if (!voiceConfig.enabled) {
      return response.status(403).json({
        success: false,
        error: 'Módulo de voz desabilitado no servidor.',
      })
    }

    const { actions } = request.only(['actions'])

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return response.status(400).json({
        success: false,
        error: 'Nenhuma ação para confirmar.',
      })
    }

    try {
      logger.info(
        { actionsCount: actions.length, empresaId: user.empresa.id },
        'VOICE_CONFIRM_REQUEST'
      )

      const timezone = request.header('x-timezone') || 'America/Sao_Paulo'

      const result = await VoiceOrderingService.execute(actions, user.empresa.id, user, timezone)

      return response.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error: error.message }, 'VOICE_CONFIRM_ERROR')
      return response.status(422).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * Retorna status do módulo de voz (config, feature flag, etc).
   * GET /api/voice/status
   */
  async status({ auth, response }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const { default: VoiceConfig } = await import('#models/voice_config')
    const config = await VoiceConfig.query().where('empresa_id', user.empresa.id).first()

    return response.json({
      success: true,
      data: {
        serverEnabled: voiceConfig.enabled,
        empresaEnabled: config?.enabled || false,
        configured: !!config?.openaiApiKeyEncrypted,
        maskedKey: config?.maskedApiKey || null,
        whisperModel: config?.whisperModel || voiceConfig.whisperModel,
        llmModel: config?.llmModel || voiceConfig.llmModel,
        maxAudioSeconds: voiceConfig.maxAudioSeconds,
      },
    })
  }
}
