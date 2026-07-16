# Prompt - Roteamento e HTTP

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Documentar rotas, middleware, contratos HTTP e validação do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `start/routes.ts` — grupos de rota existentes (auth middleware)
  - `app/middleware/` — auth, shield, session
  - `config/bodyparser.ts` — multipart config
  - `config/shield.ts` — CSRF (precisa de exceção para API multipart)

Rotas do módulo

| Método | Rota                        | Controller                              | Descrição                          |
|--------|-----------------------------|-----------------------------------------|------------------------------------|
| POST   | `/api/voice/process`        | `voice_ordering_controller.process`     | Pipeline completo: STT → NLU → ação |
| POST   | `/api/voice/transcribe`     | `voice_ordering_controller.transcribe`  | Apenas transcrição (debug/teste)   |
| GET    | `/api/voice/context`        | `voice_ordering_controller.context`     | Retorna cardápio + mesas ativas    |
| GET    | `/api/voice/status`         | `voice_ordering_controller.status`      | Health check do módulo (API key ok?) |

Grupo de rotas

```typescript
// start/routes.ts — adicionar dentro do grupo autenticado
router.group(() => {
  router.post('/voice/process', '#controllers/voice_ordering_controller.process')
    .as('voice.process')
  router.post('/voice/transcribe', '#controllers/voice_ordering_controller.transcribe')
    .as('voice.transcribe')
  router.get('/voice/context', '#controllers/voice_ordering_controller.context')
    .as('voice.context')
  router.get('/voice/status', '#controllers/voice_ordering_controller.status')
    .as('voice.status')
})
  .prefix('/api')
  .middleware([middleware.auth()])
```

Contrato HTTP — POST /api/voice/process

## Request

```text
Content-Type: multipart/form-data

Fields:
  audio: File (webm/ogg/mp3/wav, ≤ 10MB)
  comandaId?: number
  mesaId?: number
  pedidoId?: number (contexto de pedido aberto)
```

## Response 200

```json
{
  "transcript": "dois x-burger sem cebola pra mesa cinco",
  "actions": [
    {
      "intent": "create_order",
      "confidence": 0.92,
      "mesa": 5,
      "items": [
        {
          "name": "x-burger",
          "matchedProductId": 42,
          "matchedProductName": "X-Burger Artesanal",
          "quantity": 2,
          "specialInstructions": "sem cebola"
        }
      ],
      "orderType": "dine_in"
    }
  ],
  "results": [
    {
      "actionIndex": 0,
      "success": true,
      "pedidoId": 789,
      "orderNumber": "001"
    }
  ],
  "feedback": "Pedido criado: 2x X-Burger Artesanal sem cebola (mesa 5)"
}
```

## Response 422 (áudio inválido ou transcrição vazia)

```json
{
  "error": "transcription_empty",
  "message": "Não foi possível transcrever o áudio. Tente novamente mais perto do microfone."
}
```

## Response 503 (OpenAI indisponível)

```json
{
  "error": "openai_unavailable",
  "message": "Serviço de voz temporariamente indisponível. Use o pedido manual."
}
```

Middleware e segurança

- **Auth**: obrigatório — apenas usuários logados podem usar voz.
- **CSRF**: endpoint `/api/voice/*` precisa de exceção no Shield (multipart com JS fetch).
- **Rate limit**: sugerido 10 req/min por usuário (evitar abuso de API OpenAI).
- **Feature flag**: guard no controller verifica `VOICE_ORDERING_ENABLED` antes de processar.

Pedido

1) Confirme que o shield.ts permite desabilitar CSRF para rotas `/api/*` (padrão comum no Tavolo).
2) Verifique se o grupo `/api` já tem middleware de auth configurado em `start/routes.ts`.
3) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Todas as rotas de voz usam JSON como resposta (não HTML).
- Responda em PT-BR, salvo instrução contrária.
