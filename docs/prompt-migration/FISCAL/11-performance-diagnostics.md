# Prompt - Diagnóstico de Falhas Fiscais

Role: Você está conduzindo diagnóstico técnico de incidentes fiscais.
Objetivo: Determinar causa raiz com evidências e propor mitigacao verificável.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Referencias prioritárias:
  - `docs/FISCAL_TRANSMISSION_DEBUG.md`
  - `docs/FISCAL_EMISSION_FIX.md`
  - `docs/prompt-migration/FISCAL/FISCAL_EMISSION_FIX_CONTEXT.md` (legado)
  - `docs/prompt-migration/FISCAL/SOAP_NFE_400_FIX.md` (legado)
  - `app/services/sefaz/*`

Pedido

1) Produza linha do tempo do incidente com sinais observados.
2) Diferencie causa raiz de sintomas.
3) Defina verificacoes objetivas para confirmar a hipotese.
4) Se houver ação solicitada, plano numerado por ordem de impacto.

Saída esperada

- Context Summary (8-12 bullets)
- Source Map (arquivos utilizados)
- Open Questions (se houver)
- Action Plan (quando houver solicitação de ação)

Restrições

- Não invente cStat, payloads ou endpoints.
- Qualquer conclusao deve citar fonte interna do repo.
