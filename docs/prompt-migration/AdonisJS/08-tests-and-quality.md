# Prompt - Testes e Qualidade

Role: Você está avaliando cobertura de testes e controles de qualidade.
Objetivo: Resumir estrategia de testes e lacunas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Config de testes: adonisrc.ts
- Testes: tests/*
- Secoes de testes no README

Entregável

- Suites de teste e o que cobrem.
- Lacunas conhecidas (testes funcionais desabilitados, etc).
- Recomendacoes alinhadas com a abordagem de testes do AdonisJS.
- Validacao de integridade de bindings HTTP em `start/routes.ts` (`#controllers/<controller>.<method>`).
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Use apenas evidência dos arquivos do repo.

Checklist obrigatório para APIs de integração (Tavolo)

1. Verificar se cada controller referenciado em `start/routes.ts` existe em `app/controllers`.
2. Verificar se cada método referenciado existe na classe correspondente.
3. Para endpoints públicos usados por integrações, preferir aliases retrocompatíveis ao invés de renomear rotas.
4. Validar `npm run build` após ajustes para garantir estabilidade de release.
