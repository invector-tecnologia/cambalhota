# Prompt - Modelo de Dados Fiscal

Role: Você está avaliando persistência fiscal no Tavolo.
Objetivo: Identificar entidades, relacoes e campos críticos para rastreabilidade.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Referencias:
  - `app/models/fiscal_note.ts`
  - `app/models/fiscal_config.ts`
  - `database/migrations/*fiscal*`
  - `docs/FISCAL_EMISSION_FIX.md`

Pedido

1) Liste tabelas e proposito curto.
2) Explique relacoes entre venda, configuração e nota fiscal.
3) Destaque campos de retry/diagnóstico (attempt_count, errors, retryable).
4) Se houver ação solicitada, gere plano numerado.

Restrições

- Não invente estrutura de tabela.
- Evidencie qualquer diferenca entre docs e estado atual do código.
