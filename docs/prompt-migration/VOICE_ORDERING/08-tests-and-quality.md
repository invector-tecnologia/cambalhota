# Prompt - Testes e Qualidade

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Definir estratégia de testes, cobertura e gates de qualidade para o módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `docs/TESTING.md` — padrões de teste do Tavolo
  - `tests/` — diretório de testes existente (Japa)
  - `tsconfig.test.json` — config de compilação para testes

Estratégia de testes

## Camada 1: Testes unitários (sem API externa)

| Componente              | O que testar                                         | Mock necessário           |
|-------------------------|------------------------------------------------------|---------------------------|
| VoiceIntentParser       | Parsing de JSON do LLM em `ParsedVoiceAction[]`     | Response mockada do GPT   |
| VoiceActionExecutor     | Mapping intent → chamada correta ao PedidoService    | PedidoService mockado     |
| VoiceTranscriber        | Tratamento de erro, timeout, resposta vazia          | OpenAI client mockado     |
| Fuzzy matching          | Resolução de nomes falados → IDs de produto          | Lista de produtos em memória |
| Validação de request    | Rejeição de áudio maior que limite, formato inválido | —                         |

## Camada 2: Testes de integração (com mocks de OpenAI)

| Cenário                                  | Setup                                      | Resultado esperado                     |
|------------------------------------------|--------------------------------------------|----------------------------------------|
| Pipeline completo com áudio válido       | Mock Whisper + Mock GPT, DB real (SQLite)  | Pedido criado no banco                 |
| Áudio vazio / silêncio                   | Mock Whisper retorna texto vazio           | Response 422 com erro amigável         |
| Item não encontrado no cardápio          | Mock GPT retorna item desconhecido        | `VOICE_ACTION_REJECTED` logado         |
| OpenAI timeout                           | Mock com delay > timeout                   | Response 503 com fallback             |
| Confiança abaixo do threshold            | Mock GPT com confidence 0.3               | `requiresConfirmation: true`           |
| Múltiplas ações numa frase               | "2 burgers e 1 coca pra mesa 3"           | 2 itens no mesmo pedido                |
| Feature flag desabilitada                | `VOICE_ORDERING_ENABLED=false`             | Response 404                           |

## Camada 3: Smoke test manual (pós-deploy)

```bash
# 1. Verificar que o endpoint responde
curl -s -w '%{http_code}' https://www.tavolo.com.br/api/voice/status

# 2. Enviar áudio de teste (precisa de auth cookie)
curl -X POST https://www.tavolo.com.br/api/voice/process \
  -H "Cookie: adonis-session=..." \
  -F "audio=@test-audio.webm" \
  -F "mesaId=1"
```

Fixtures de teste

## Áudio de teste

Gerar arquivos de áudio sintéticos com frases padrão para testes determinísticos:

```text
fixtures/voice/
  dois-xburger-mesa-5.webm    → "dois x-burger sem cebola pra mesa 5"
  coca-cola.webm               → "uma coca-cola"
  fechar-comanda-mesa-3.webm  → "fecha a comanda da mesa 3"
  silencio.webm                → (1s de silêncio)
  ruido.webm                   → (ruído ambiente sem fala)
```

## Mocks de resposta OpenAI

```typescript
// tests/fixtures/voice_mocks.ts
export const whisperMockResponse = {
  text: 'dois x-burger sem cebola pra mesa cinco',
  language: 'pt',
  duration: 3.2,
}

export const nluMockResponse = {
  actions: [{
    intent: 'create_order',
    confidence: 0.92,
    mesa: 5,
    items: [{
      name: 'x-burger',
      matchedProductId: 42,
      matchedProductName: 'X-Burger Artesanal',
      quantity: 2,
      specialInstructions: 'sem cebola',
    }],
    orderType: 'dine_in',
  }],
}
```

Gates de qualidade

- `npm run typecheck` — zero erros TypeScript nos novos arquivos
- `npm run lint` — zero warnings nos novos arquivos
- `npm run build` — build completo sem erros
- `npm run test` — todos os testes unitários passam
- Cobertura mínima: 80% para services de voz

Pedido

1) Confirme que Japa suporta mocks de módulos ES (para mocar o SDK da OpenAI).
2) Verifique se existe padrão de mock no projeto (`sinon` está em devDependencies).
3) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Testes nunca chamam a API real da OpenAI — sempre mocks.
- Responda em PT-BR, salvo instrução contrária.
