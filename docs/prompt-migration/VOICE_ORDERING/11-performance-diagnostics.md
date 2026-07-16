# Prompt - Diagnóstico de Performance

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Definir processo de diagnóstico (RCA) para problemas de performance e acurácia do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `docs/LOGGING.md` — padrão de logs
  - `app/services/cloud_logger.ts` — eventos de log
  - Eventos definidos em `VOICE_ORDERING/05-observability.md`

Árvore de diagnóstico

## Problema: "O pedido por voz está lento"

```text
1. Verificar VOICE_PROCESS_COMPLETE.totalDurationMs
   ├── > 5000ms → pipeline inteiro lento
   │   ├── VOICE_TRANSCRIBE_OK.durationMs > 2000ms → Whisper lento
   │   │   ├── Áudio > 30s → orientar gravar mais curto
   │   │   └── Áudio < 10s → possível degradação da API OpenAI
   │   ├── VOICE_NLU_OK.durationMs > 1500ms → GPT lento
   │   │   ├── System prompt > 4K tokens → comprimir lista de cardápio
   │   │   └── System prompt < 2K tokens → possível degradação da API
   │   └── Ambos rápidos → gargalo na execução (DB, insumo check)
   └── < 3000ms → performance aceitável, investigar percepção do usuário
```

## Problema: "O sistema não entende o que eu falo"

```text
1. Verificar VOICE_TRANSCRIBE_OK.text
   ├── Texto vazio → problema de captura de áudio
   │   ├── Microfone não autorizado no browser
   │   ├── Volume muito baixo (ruído > sinal)
   │   └── Formato de áudio não suportado
   ├── Texto incorreto → problema de transcrição
   │   ├── Sotaque forte → sem solução imediata (Whisper melhora com contexto)
   │   └── Nomes de produto muito incomuns → adicionar prompt hint
   └── Texto correto mas ação errada → problema de NLU
       ├── VOICE_CONFIDENCE_LOW → ajustar threshold ou system prompt
       ├── Item não encontrado → produto não existe ou nome muito diferente
       └── Intent errado → refinar system prompt com exemplos
```

## Problema: "O pedido foi criado errado"

```text
1. Verificar VOICE_ACTION_EXECUTED
   ├── matchedProductId correto, quantity errada → NLU parsing error
   ├── matchedProductId errado → fuzzy matching falhou
   │   └── Verificar cardápio: nomes ambíguos? ("X-Tudo" vs "X-Tudo Especial")
   └── mesa/comanda errada → contexto não foi passado ou NLU ignorou
```

Comandos de diagnóstico

```bash
# Últimas 50 transcrições com duração
heroku logs --app tavolo --num 5000 | grep VOICE_TRANSCRIBE_OK | tail -50

# Ações rejeitadas e motivos
heroku logs --app tavolo --num 5000 | grep VOICE_ACTION_REJECTED

# Média de confiança (requer jq)
heroku logs --app tavolo --num 5000 | grep VOICE_NLU_OK | \
  grep -oP '"confidence":\K[0-9.]+' | awk '{s+=$1; n++} END {print s/n}'

# Erros de OpenAI
heroku logs --app tavolo --num 5000 | grep 'VOICE_.*ERROR'
```

Métricas de acurácia

| Métrica                     | Alvo    | Como medir                                       |
|-----------------------------|---------|---------------------------------------------------|
| Taxa de transcrição correta | ≥ 90%   | Sampling manual de `VOICE_TRANSCRIBE_OK.text`     |
| Taxa de intent correto      | ≥ 85%   | Comparar NLU output com ação esperada             |
| Taxa de produto correto     | ≥ 95%   | Comparar `matchedProductId` com intenção real     |
| Taxa de execução com sucesso| ≥ 95%   | `VOICE_ACTION_EXECUTED.success / total`            |

Pedido

1) Defina um processo de sampling semanal para validar acurácia em produção.
2) Crie alertas para taxa de erro > 10% em janela de 1 hora.
3) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Responda em PT-BR, salvo instrução contrária.
