# Prompt - Observabilidade

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Definir sinais de log, métricas e trilhas de diagnóstico para o módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `app/services/cloud_logger.ts` — serviço de log centralizado existente (Cloudflare R2)
  - `config/logger.ts` — configuração Pino
  - `docs/LOGGING.md` — padrões de log do Tavolo

Eventos de log obrigatórios

| Evento                        | Nível | Payload                                                         |
|-------------------------------|-------|-----------------------------------------------------------------|
| `VOICE_TRANSCRIBE_START`      | info  | `{ userId, empresaId, audioSizeBytes, audioFormat }`            |
| `VOICE_TRANSCRIBE_OK`         | info  | `{ userId, empresaId, durationMs, textLength, language }`       |
| `VOICE_TRANSCRIBE_ERROR`      | error | `{ userId, empresaId, error, audioSizeBytes }`                  |
| `VOICE_NLU_START`             | info  | `{ userId, empresaId, transcriptLength }`                       |
| `VOICE_NLU_OK`                | info  | `{ userId, empresaId, durationMs, actionsCount, intents }`      |
| `VOICE_NLU_ERROR`             | error | `{ userId, empresaId, error, transcript }`                      |
| `VOICE_ACTION_EXECUTED`       | info  | `{ userId, empresaId, intent, success, pedidoId?, error? }`     |
| `VOICE_ACTION_REJECTED`       | warn  | `{ userId, empresaId, intent, reason }`                         |
| `VOICE_CONFIDENCE_LOW`        | warn  | `{ userId, empresaId, intent, confidence, threshold }`          |
| `VOICE_PROCESS_COMPLETE`      | info  | `{ userId, empresaId, totalDurationMs, actionsCount }`          |

Métricas-chave

| Métrica                         | Tipo      | Descrição                                           |
|---------------------------------|-----------|------------------------------------------------------|
| `voice.transcription.duration`  | histogram | Tempo de resposta do Whisper (ms)                    |
| `voice.nlu.duration`            | histogram | Tempo de resposta do GPT-4o-mini (ms)                |
| `voice.pipeline.duration`       | histogram | Tempo total do pipeline (capture → resultado)        |
| `voice.actions.success_rate`    | gauge     | Taxa de ações executadas com sucesso (%)             |
| `voice.confidence.avg`          | gauge     | Confiança média das ações NLU                        |
| `voice.errors.count`            | counter   | Total de erros (STT + NLU + execução)                |

Padrão de log

Seguir o padrão existente do Tavolo com `cloudLogger`:

```typescript
cloudLogger.info('VOICE_TRANSCRIBE_OK', {
  userId: user.id,
  empresaId: user.empresaId,
  durationMs: Date.now() - startTime,
  textLength: transcript.length,
  language: 'pt',
})
```

Diagnóstico de falhas

| Sintoma                        | Verificação                                              |
|--------------------------------|----------------------------------------------------------|
| Transcrição vazia              | Log `VOICE_TRANSCRIBE_OK` com `textLength: 0`           |
| Item não encontrado            | Log `VOICE_ACTION_REJECTED` com `reason: item_not_found` |
| Timeout na OpenAI              | Log `VOICE_TRANSCRIBE_ERROR` com timeout                 |
| Confiança baixa sistêmica      | Filtrar `VOICE_CONFIDENCE_LOW` por empresa/período       |

Pedido

1) Confirme que `cloudLogger` está disponível em services (já usado em `pedido_service.ts`).
2) Defina se métricas serão apenas logs ou se haverá integração com dashboard.
3) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Nunca logar o conteúdo completo do áudio — apenas metadados (tamanho, formato, duração).
- Nunca logar a API key da OpenAI.
- Responda em PT-BR, salvo instrução contrária.
