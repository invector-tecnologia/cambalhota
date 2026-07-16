# Prompt - Arquitetura

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Mapear componentes, fronteiras e fluxo de requisição ponta a ponta do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `app/controllers/pedidos_controller.ts` — endpoint `store` com validação vine
  - `app/services/pedido_service.ts` — `PedidoService.createPedido`
  - `app/services/insumo_stock_service.ts` — verificação de disponibilidade
  - `start/routes.ts` — grupo de rotas protegidas por auth middleware
  - `resources/js/app.js` — bundle JS global (Alpine.js)

Diagrama de fluxo

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Browser)                         │
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────────┐  │
│  │ Botão Mic   │───▶│ MediaRecorder │───▶│ Audio Blob (webm/ogg) │  │
│  │ (Alpine.js) │    │ API          │    │ ≤ 25 MB                │  │
│  └─────────────┘    └──────────────┘    └────────┬───────────────┘  │
│                                                  │                  │
│  ┌──────────────────────────────────────────────▼──────────────┐   │
│  │  POST /api/voice/process  (FormData: audio + context)       │   │
│  └──────────────────────────────────────────────┬──────────────┘   │
└─────────────────────────────────────────────────┼──────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼──────────────────┐
│                        BACKEND (AdonisJS)                          │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  voice_ordering_controller.ts                               │   │
│  │  1. Autentica usuário (auth middleware)                     │   │
│  │  2. Verifica feature flag global (VOICE_ORDERING_ENABLED)   │   │
│  │  3. Extrai audio blob do multipart                          │   │
│  │  4. Chama VoiceOrderingService.process(audio, context)      │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
│                                 │                                  │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │  voice_ordering_service.ts                                  │   │
│  │                                                             │   │
│  │  Etapa 0: Resolução da API Key (BYOK)                       │   │
│  │  ┌──────────────────────────────────────────┐               │   │
│  │  │ VoiceConfig.query()                      │               │   │
│  │  │   .where('empresa_id', user.empresaId)   │               │   │
│  │  │   .where('enabled', true)                │               │   │
│  │  │   .firstOrFail()                         │               │   │
│  │  │ → Descriptografa openaiApiKey (AES-256)  │               │   │
│  │  │ → Instancia OpenAI client com a key      │               │   │
│  │  └──────────────────┬───────────────────────┘               │   │
│  │                     │ apiKey da empresa                     │   │
│  │                     ▼                                       │   │
│  │  Etapa 1: STT (Speech-to-Text)                              │   │
│  │  ┌──────────────────────────────────────────┐               │   │
│  │  │ OpenAI Whisper API                       │               │   │
│  │  │ POST https://api.openai.com/v1/audio/    │               │   │
│  │  │      transcriptions                      │               │   │
│  │  │ model: whisper-1                         │               │   │
│  │  │ language: pt                             │               │   │
│  │  │ response_format: json                    │               │   │
│  │  └──────────────────┬───────────────────────┘               │   │
│  │                     │ { text: "dois x-burger..." }          │   │
│  │                     ▼                                       │   │
│  │  Etapa 2: NLU (Natural Language Understanding)              │   │
│  │  ┌──────────────────────────────────────────┐               │   │
│  │  │ OpenAI GPT-4o-mini                       │               │   │
│  │  │ System prompt com:                       │               │
│  │  │  - Cardápio da empresa (nomes + IDs)     │               │   │
│  │  │  - Comandas/mesas ativas                 │               │   │
│  │  │  - Ações válidas (enum)                  │               │   │
│  │  │ User message: transcrição do Whisper     │               │   │
│  │  │ response_format: json_object             │               │   │
│  │  └──────────────────┬───────────────────────┘               │   │
│  │                     │ { actions: [...] }                    │   │
│  │                     ▼                                       │   │
│  │  Etapa 3: Validação e execução                              │   │
│  │  ┌──────────────────────────────────────────┐               │   │
│  │  │ Para cada ação:                          │               │   │
│  │  │  - Valida item existe no cardápio        │               │   │
│  │  │  - Valida disponibilidade (insumos)      │               │   │
│  │  │  - Valida mesa/comanda existe            │               │   │
│  │  │  - Executa via PedidoService / Comanda   │               │   │
│  │  └──────────────────┬───────────────────────┘               │   │
│  │                     │                                       │   │
│  └─────────────────────┼───────────────────────────────────────┘   │
│                        │                                           │
│  Response JSON:        ▼                                           │
│  {                                                                 │
│    transcript: "dois x-burger sem cebola pra mesa 5",             │
│    actions: [{ type: "create_order", ... }],                       │
│    results: [{ success: true, pedidoId: 123 }],                    │
│    feedback: "Pedido criado: 2x X-Burger (mesa 5)"                │
│  }                                                                 │
└────────────────────────────────────────────────────────────────────┘
```

Componentes

| Componente | Responsabilidade | Arquivo previsto |
| --- | --- | --- |
| VoiceRecorderWidget | UI de gravação com Alpine.js | `resources/js/voice-recorder.js` |
| VoiceOrderingController | Endpoint HTTP, auth, orquestração | `app/controllers/voice_ordering_controller.ts` |
| VoiceOrderingService | Pipeline STT → NLU → execução (com key BYOK) | `app/services/voice_ordering_service.ts` |
| VoiceTranscriber | Wrapper da API Whisper | `app/services/voice_transcriber.ts` |
| VoiceIntentParser | Wrapper GPT-4o-mini com system prompt dinâmico | `app/services/voice_intent_parser.ts` |
| VoiceActionExecutor | Mapeia intents → chamadas a PedidoService | `app/services/voice_action_executor.ts` |
| VoiceConfig (model) | Armazena API key OpenAI por empresa (BYOK) | `app/models/voice_config.ts` |
| VoiceConfigController | CRUD da tela de integração de voz | `app/controllers/voice_config_controller.ts` |
| Voice partial (Edge) | Componente de UI incluído nas views de operação | `resources/views/partials/voice-widget.edge` |
| Voice config view (Edge) | Tela de integração em /configuracoes/voz | `resources/views/configuracoes/voz.edge` |

Fronteiras

- **Frontend ↔ Backend**: multipart POST com blob de áudio + JSON de contexto (mesa atual, comanda ativa).
- **Backend ↔ OpenAI**: HTTPS REST, sem WebSocket (Whisper não suporta streaming). API key vem do `VoiceConfig` da empresa (BYOK), não de env var.
- **VoiceOrderingService ↔ VoiceConfig**: leitura de `voice_configs` para resolver API key da empresa do usuário autenticado.
- **VoiceOrderingService ↔ PedidoService**: chamada direta TypeScript (sem HTTP intermediário).
- **Auth**: mesma auth session do Tavolo — o widget de voz só aparece para usuários logados com empresa que tem `VoiceConfig.enabled = true`.

Pedido

1) Confirme que MediaRecorder gera áudio em formato aceito pelo Whisper (webm, mp3, mp4, wav, ogg).
2) Verifique limites de upload do AdonisJS (`config/bodyparser.ts` → `multipart.maxFileSize`).
3) Mapeie o system prompt do GPT-4o-mini: deve incluir cardápio + mesas ativas para fuzzy matching.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Chamadas à OpenAI são server-side; a API key nunca é exposta no frontend.
- A API key é armazenada por empresa (modelo BYOK) e criptografada no banco.
- Responda em PT-BR, salvo instrução contrária.
