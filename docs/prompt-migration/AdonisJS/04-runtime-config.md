# Prompt - Configuração de Runtime

Role: Você está auditando configuração de runtime para confiabilidade e segurança.
Objetivo: Resumir env vars e configuracoes que impactam o comportamento.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Validação de ambiente: start/env.ts
- Config HTTP: config/app.ts
- Config DB: config/database.ts
- Config sessao/auth: config/session.ts, config/auth.ts
- Config de logs: config/logger.ts
- Body parsing: config/bodyparser.ts
- Security headers: config/shield.ts

Entregável

- Lista de env vars obrigatorias e o que controlam.
- Riscos de defaults ou fallbacks.
- Recomendacoes para alinhar com boas praticas de producao.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Amarre cada afirmação a um arquivo.
- Não invente env vars ausentes.
