# Prompt - Testes e Qualidade Fiscal

Role: Você está avaliando qualidade tecnica do módulo fiscal.
Objetivo: Mapear cobertura, lacunas e criterios de confiabilidade.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Referencias:
  - `docs/TESTING.md`
  - `tests/**/*fiscal*`
  - `scripts/*fiscal*`
  - `package.json` (scripts de teste/build)

Pedido

1) Liste o que ja e coberto por testes no fiscal.
2) Aponte lacunas de alto risco (transmissão, parser, retry, cancelamento).
3) Defina checks minimos para CI/CD (typecheck, build, testes foco fiscal).
4) Se houver ação solicitada, plano numerado por prioridade.

Restrições

- Baseie-se em evidências reais no repo.
- Evite recomendações genericas sem ancoragem.
