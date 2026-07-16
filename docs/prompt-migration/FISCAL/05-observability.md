# Prompt - Observabilidade Fiscal

Role: Você está analisando logs e diagnóstico do módulo fiscal.
Objetivo: Definir como detectar, triar e acompanhar incidentes de emissão.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes:
  - `docs/FISCAL_TRANSMISSION_DEBUG.md`
  - `docs/LOGGING.md`
  - `app/services/fiscal_*`
  - `app/services/sefaz/*`

Pedido

1) Liste sinais de falha e eventos de log relevantes.
2) Diferencie erro de transporte vs rejeicao semantica da SEFAZ.
3) Proponha rotina de diagnóstico com passos verificaveis.
4) Se houver ação solicitada, plano curto e numerado.

Restrições

- Não inferir eventos inexistentes.
- Priorizar evidências do repositório.
