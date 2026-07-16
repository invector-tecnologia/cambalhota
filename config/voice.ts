import env from '#start/env'

const voiceConfig = {
  enabled: !!env.get('VOICE_ORDERING_ENABLED', false),
  whisperModel: env.get('VOICE_WHISPER_MODEL', 'whisper-1'),
  llmModel: env.get('VOICE_LLM_MODEL', 'gpt-4o-mini'),
  maxAudioSeconds: Number(env.get('VOICE_MAX_AUDIO_SECONDS', '30')),
  maxFileSizeMb: Number(env.get('VOICE_MAX_FILE_SIZE_MB', '10')),
  confidenceThreshold: Number(env.get('VOICE_CONFIDENCE_THRESHOLD', '0.7')),
}

export default voiceConfig
