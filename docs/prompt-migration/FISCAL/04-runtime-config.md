# Prompt - Configuração de Runtime Fiscal

Role: Você está revisando configuração de runtime do módulo fiscal.
Objetivo: Mapear variaveis de ambiente, chaves e defaults que afetam emissão.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes:
  - `docs/FISCAL_ENCRYPTION_KEY_CONFIG.md`
  - `docs/fiscal-quickstart.md`
  - `config/*`
  - `start/env.ts` (quando aplicável)

Pedido

1) Liste configuracoes essenciais (certificado, ambiente, CSC, endpoint, timeout).
2) Indique riscos de configuração incorreta e sinais de falha.
3) Documente checklist minimo para homologacao e producao.
4) Se houver ação solicitada, gere plano numerado com resultado esperado.

Restrições

- Baseie afirmações em docs/código do repo.
- Marque variaveis desconhecidas e como validar.
