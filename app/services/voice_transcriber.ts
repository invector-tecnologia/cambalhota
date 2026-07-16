/**
 * VoiceTranscriber — Wrapper da API OpenAI Whisper.
 * Converte áudio em texto usando o modelo whisper-1.
 */
import OpenAI from 'openai'
import logger from '@adonisjs/core/services/logger'

export interface WhisperResult {
  text: string
  language: string
  durationMs: number
}

export default class VoiceTranscriber {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string = 'whisper-1') {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  /**
   * Transcreve um buffer de áudio para texto em PT-BR.
   */
  async transcribe(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<WhisperResult> {
    const startMs = Date.now()

    try {
      // OpenAI SDK espera um File-like object
      const file = new File([audioBuffer], filename, { type: 'audio/webm' })

      const response = await this.client.audio.transcriptions.create({
        model: this.model,
        file: file,
        language: 'pt',
        response_format: 'json',
      })

      const durationMs = Date.now() - startMs

      logger.info({ durationMs, textLength: response.text.length }, 'VOICE_TRANSCRIBE_OK')

      return {
        text: response.text,
        language: 'pt',
        durationMs,
      }
    } catch (error: any) {
      const durationMs = Date.now() - startMs
      logger.error({ error: error.message, durationMs }, 'VOICE_TRANSCRIBE_ERROR')
      throw new Error(`Falha na transcrição: ${error.message}`)
    }
  }
}
