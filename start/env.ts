/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  APP_DOMAIN: Env.schema.string.optional(),
  APP_SECURE_COOKIES: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DATABASE_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Fiscal Engine
  |----------------------------------------------------------
  */
  FISCAL_ENCRYPTION_KEY: Env.schema.string(),
  // UF principal para QRCode NF-e (ex.: 'SP')
  FISCAL_SEFAZ_STATE: Env.schema.string.optional(),
  // Endpoint base oficial de consulta de QRCode (opcional, sobrescreve o mapeamento por UF)
  FISCAL_NFCE_QR_BASE: Env.schema.string.optional(),
  // Ambiente SEFAZ (true=homologação, false=produção)
  FISCAL_SEFAZ_HOMOLOG: Env.schema.boolean.optional(),
  // Loga payload SOAP completo para debug (use com cautela)
  FISCAL_SEFAZ_LOG_PAYLOAD: Env.schema.boolean.optional(),
  // Caminho para CA bundle adicional (PEM) para validar SEFAZ em producao
  FISCAL_SEFAZ_CA_BUNDLE_PATH: Env.schema.string.optional(),
  // Valida XML contra XSD antes de enviar (opcional)
  FISCAL_SEFAZ_XSD_VALIDATE: Env.schema.boolean.optional(),
  // Caminho para o XSD principal da NFe 4.00
  FISCAL_SEFAZ_XSD_PATH: Env.schema.string.optional(),
  // URL oficial do pacote XSD (zip ou xsd direto)
  FISCAL_SEFAZ_XSD_URL: Env.schema.string.optional(),
  // Timeout (ms) para requisicoes aos webservices SEFAZ
  FISCAL_SEFAZ_TIMEOUT_MS: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Cloudflare Images
  |----------------------------------------------------------
  */
  CF_IMAGES_ACCOUNT_ID: Env.schema.string.optional(),
  CF_IMAGES_API_TOKEN: Env.schema.string.optional(),
  // Base de entrega (ex.: https://imagedelivery.net/<account_hash>)
  CF_IMAGES_DELIVERY_BASE: Env.schema.string.optional(),
  // Variante padrão (ex.: 'public', 'thumb', 'card')
  CF_IMAGES_DEFAULT_VARIANT: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Voice Ordering (OpenAI)
  |----------------------------------------------------------
  */
  VOICE_ORDERING_ENABLED: Env.schema.boolean.optional(),
  VOICE_WHISPER_MODEL: Env.schema.string.optional(),
  VOICE_LLM_MODEL: Env.schema.string.optional(),
  VOICE_MAX_AUDIO_SECONDS: Env.schema.number.optional(),
  VOICE_MAX_FILE_SIZE_MB: Env.schema.number.optional(),
  VOICE_CONFIDENCE_THRESHOLD: Env.schema.number.optional(),
})
