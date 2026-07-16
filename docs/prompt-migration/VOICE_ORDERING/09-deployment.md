# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Documentar checklist de release, smoke tests e rollback do módulo de voz.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - `docs/DEPLOYMENT.md` — padrão de deploy Heroku do Tavolo
  - `Procfile` — processo web existente
  - `setup-heroku-env.sh` — script de variáveis de ambiente

Pré-requisitos de deploy

1. Dependência `openai` instalada (`npm install openai`).
2. Migration `create_voice_configs` executada.
3. Variáveis de ambiente configuradas no Heroku:
   - `VOICE_ORDERING_ENABLED=true` — feature flag global.
   - **Nota**: `OPENAI_API_KEY` não é var de servidor. Cada empresa configura via `/configuracoes/voz` (modelo BYOK).
4. Build passa sem erros (`npm run build`).
5. Testes unitários passam (`npm run test`).

Checklist de release

| # | Passo                                    | Verificação                                | Rollback                     |
|---|------------------------------------------|--------------------------------------------|------------------------------|
| 1 | Configurar feature flag no Heroku        | `heroku config --app tavolo \| grep VOICE` | `heroku config:unset ...`    |
| 2 | Executar migration `voice_configs`       | Tabela existe no banco                     | Rollback da migration        |
| 3 | Deploy via `git push heroku main`        | Build log sem erros                        | `heroku rollback --app tavolo` |
| 4 | Smoke test: GET `/api/voice/status`      | Retorna `{ enabled: true }`                | Desabilitar feature flag     |
| 5 | Empresa teste: configurar key em `/configuracoes/voz` | Key salva e teste de conexão ok | Desabilitar VoiceConfig      |
| 6 | Teste funcional com áudio real           | Pedido criado com sucesso                  | —                            |
| 7 | Monitorar logs por 15 min               | Sem `VOICE_*_ERROR` excessivos             | Desabilitar feature flag     |

Estratégia de rollback

O módulo de voz é 100% desativável via feature flag, sem necessidade de rollback do deploy:

```bash
# Desabilitar imediatamente sem redeploy
heroku config:set VOICE_ORDERING_ENABLED=false --app tavolo
```

Isso remove o widget do frontend e retorna 404 para rotas `/api/voice/*`.
Para desabilitar apenas uma empresa, setar `VoiceConfig.enabled = false` no banco.

Custos operacionais (por empresa — modelo BYOK)

O custo da API OpenAI é arcado pelo dono do restaurante, que fornece sua própria API key via tela de integração (`/configuracoes/voz`).

| Serviço        | Preço              | Estimativa mensal (100 pedidos/dia) |
|----------------|--------------------|--------------------------------------|
| Whisper API    | $0.006 / minuto    | ~$5.40 (30s × 100 × 30 dias)        |
| GPT-4o-mini    | $0.15 / 1M tokens  | ~$1.35 (300 tokens × 3000 req)       |
| **Total**      |                    | **~$6.75 / mês por empresa**         |

O Tavolo não incorre em custo de API — apenas provê a infraestrutura de integração.

Monitoramento pós-deploy

```bash
# Verificar logs de voz em tempo real
heroku logs --tail --app tavolo | grep VOICE_

# Contar erros nas últimas 24h
heroku logs --app tavolo --num 1500 | grep VOICE_.*ERROR | wc -l

# Verificar quantas empresas têm VoiceConfig ativo
# (via console AdonisJS ou query direta)
node ace repl
> await VoiceConfig.query().where('enabled', true).count('* as total')
```

Pedido

1) Confirme que o processo de build do Heroku inclui `npm install` (para instalar `openai`).
2) Verifique se o Heroku slug size comporta a dependência adicional.
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
