# Prompt - Configuração de Runtime e Env (Heroku)

Role: Você é um engenheiro de deploy.
Objetivo: Identificar configuracoes de runtime e requisitos de ambiente na Heroku.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Config vars são a fonte de verdade para settings por ambiente.
- Buildpack e stack afetam o comportamento de runtime.

Arquivos chave

- app.json
- Procfile
- Procfile.dev
- config/*
- setup-heroku-env.sh

Pedido

1) Liste config vars obrigatorias e o proposito de cada uma.
2) Identifique settings de build/runtime (stack, tipo de buildpack, node runtime).
3) Note restrições de regiao, maintenance mode ou dyno runtime.
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Use evidências do repo; se não existir, marque como desconhecido e proponha verificacao.
