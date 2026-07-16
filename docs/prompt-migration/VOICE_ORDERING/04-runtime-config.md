# Prompt - Configuração de Runtime

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Documentar variáveis de ambiente, feature flags e configurações necessárias.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `config/app.ts` — configuração global AdonisJS
  - `config/bodyparser.ts` — limites de upload multipart
  - `.env` / Heroku Config Vars — variáveis de ambiente existentes
  - `package.json` — dependência `openai` a adicionar

Modelo BYOK (Bring Your Own Key)

O custo da API OpenAI (Whisper + GPT-4o-mini) é repassado ao dono do restaurante.
Cada empresa cadastra sua própria API key da OpenAI via tela de integração no painel administrativo.
Sem uma key configurada, o módulo de voz fica indisponível para a empresa.

Padrão de referência: `FiscalConfig` (`app/models/fiscal_config.ts`) — modelo separado vinculado via `empresaId`, com controller CRUD próprio e tela em `/config/fiscal`.

Variáveis de ambiente (servidor)

Apenas configurações globais (feature flag e defaults) ficam no servidor. A API key da OpenAI é armazenada por empresa no banco de dados.

| Variável                    | Tipo    | Obrigatória | Default         | Descrição                                          |
|-----------------------------|---------|-------------|-----------------|-----------------------------------------------------|
| `VOICE_ORDERING_ENABLED`    | boolean | Não         | `false`         | Feature flag global — habilita o módulo de voz       |
| `VOICE_WHISPER_MODEL`       | string  | Não         | `whisper-1`     | Modelo Whisper default (override por empresa)        |
| `VOICE_LLM_MODEL`           | string  | Não         | `gpt-4o-mini`   | Modelo LLM default (override por empresa)            |
| `VOICE_MAX_AUDIO_SECONDS`   | number  | Não         | `30`            | Duração máxima de gravação no frontend (segundos)    |
| `VOICE_MAX_FILE_SIZE_MB`    | number  | Não         | `10`            | Tamanho máximo do arquivo de áudio (MB)              |
| `VOICE_CONFIDENCE_THRESHOLD`| number  | Não         | `0.7`           | Confiança mínima para executar ação sem confirmação  |

Armazenamento por empresa — VoiceConfig

Nova tabela `voice_configs` (1:1 com `empresas`), análoga a `fiscal_configs`:

```typescript
// app/models/voice_config.ts
export default class VoiceConfig extends BaseModel {
  static table = 'voice_configs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare empresaId: number            // FK → empresas.id

  @column()
  declare openaiApiKey: string         // Criptografada em repouso (aes-256-gcm)

  @column()
  declare enabled: boolean             // Empresa habilitou voz? (default false)

  @column()
  declare whisperModel: string | null  // Override do default do servidor

  @column()
  declare llmModel: string | null      // Override do default do servidor

  @belongsTo(() => Empresa)
  declare empresa: BelongsTo<typeof Empresa>
}
```

Criptografia da key: a `openaiApiKey` é criptografada com `aes-256-gcm` usando `APP_KEY` do AdonisJS como chave derivada.
Descriptografia ocorre apenas no momento da chamada à API, no `VoiceOrderingService`. A key nunca é logada nem exposta em responses.

Tela de integração

Nova rota no grupo autenticado de configurações:

| Rota                               | Controller                      | Descrição                           |
|------------------------------------|---------------------------------|--------------------------------------|
| GET  `/configuracoes/voz`          | `VoiceConfigController.edit`    | Exibe form com key mascarada         |
| POST `/configuracoes/voz`          | `VoiceConfigController.update`  | Salva/atualiza key e preferências    |
| POST `/configuracoes/voz/test`     | `VoiceConfigController.test`    | Valida key com chamada test ao Whisper |

A tela exibe:

- Campo de API key (mascarado com `sk-...xxxx` quando já configurado).
- Toggle de habilitação do módulo de voz para esta empresa.
- Selects opcionais para override de modelos (Whisper, LLM).
- Botão "Testar conexão" que envia áudio de teste ao Whisper e valida a key.

Configuração do AdonisJS

## bodyparser.ts — ajuste de upload

O `config/bodyparser.ts` precisa acomodar uploads de áudio. Verificar o `multipart.maxFileSize` atual.

```typescript
// config/bodyparser.ts — garantir que aceite áudio
multipart: {
  autoProcess: true,
  maxFileSize: '25mb', // necessário para blobs de áudio
  types: ['multipart/form-data'],
}
```

## Novo arquivo de config sugerido

```typescript
// config/voice.ts
import env from '#start/env'

export default {
  enabled: env.get('VOICE_ORDERING_ENABLED', 'false') === 'true',
  whisperModel: env.get('VOICE_WHISPER_MODEL', 'whisper-1'),
  llmModel: env.get('VOICE_LLM_MODEL', 'gpt-4o-mini'),
  maxAudioSeconds: Number(env.get('VOICE_MAX_AUDIO_SECONDS', '30')),
  maxFileSizeMb: Number(env.get('VOICE_MAX_FILE_SIZE_MB', '10')),
  confidenceThreshold: Number(env.get('VOICE_CONFIDENCE_THRESHOLD', '0.7')),
}
// Nota: openaiApiKey NÃO fica aqui — é lida do VoiceConfig (banco) por empresa
```

Feature flag (duas camadas)

O módulo usa feature flag em duas camadas:

1. **Servidor** (`VOICE_ORDERING_ENABLED`): gate global. Se `false`, nenhuma empresa tem acesso ao módulo.
2. **Empresa** (`VoiceConfig.enabled`): gate por restaurante. Só ativa se a empresa configurou uma API key válida e habilitou.

- Backend: middleware verifica flag global primeiro, depois `VoiceConfig` da empresa.
- Frontend: widget de microfone não renderiza se qualquer das duas camadas estiver desligada.
- A flag é passada para a view via `sharedData` ou prop do controller.

Configuração Heroku

```bash
# Apenas feature flag global — API keys ficam no banco por empresa
heroku config:set VOICE_ORDERING_ENABLED="true" --app tavolo
```

Pedido

1) Verifique o valor atual de `multipart.maxFileSize` em `config/bodyparser.ts`.
2) Confirme que `env.ts` (validação de env do AdonisJS) aceita as novas variáveis de servidor.
3) Verifique se há proxy ou WAF no Heroku que limite tamanho de body para multipart.
4) Projete a migration `create_voice_configs` seguindo o padrão de `create_fiscal_configs`.
5) Implemente criptografia AES-256-GCM para `openai_api_key` usando `APP_KEY` como chave derivada.
6) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- A API key da OpenAI nunca deve ser logada ou exposta no frontend.
- A key é armazenada criptografada no banco e descriptografada apenas no momento do uso.
- Padrão de referência: `FiscalConfig` para estrutura de modelo e controller CRUD.
- Responda em PT-BR, salvo instrução contrária.
