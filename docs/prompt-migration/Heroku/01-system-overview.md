# Prompt - Visão Geral do Sistema (Heroku)

Role: Você está analisando o contexto de deploy Heroku do sistema Tavolo.
Objetivo: Construir um modelo mental de como o app e implantado, executado e operado na Heroku.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Plataforma: Heroku (dynos, routing, buildpacks, releases, config vars)
- Modelo esperado: web + dynos worker opcionais
- Config: variaveis de ambiente via config vars

Arquivos chave

- Procfile
- Procfile.dev
- app.json
- package.json
- scripts/*
- heroku/*
- setup-heroku-env.sh

Pedido

1) Resuma a topologia de runtime (app, dynos, tipos de processo) em 5-8 bullets.
2) Identifique premissas de runtime (porta, env vars, release steps, add-ons).
3) Liste os fluxos operacionais críticos (deploy, rollback, scale, maintenance).
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Baseie afirmações nos arquivos listados ou em docs oficiais.
- Se faltar dado, diga "desconhecido" e proponha como confirmar.
