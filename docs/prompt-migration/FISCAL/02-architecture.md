# Prompt - Arquitetura do Módulo Fiscal

Role: Você está revisando a arquitetura do módulo fiscal.
Objetivo: Mapear componentes, responsabilidades e fluxo ponta a ponta.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Arquivos de código principais:
  - `app/services/fiscal_emission_workflow.ts`
  - `app/services/fiscal_transmitter.ts`
  - `app/services/fiscal_service.ts`
  - `app/services/fiscal_reprocessing_service.ts`
  - `app/services/sefaz/*`

Pedido

1) Descreva arquitetura em 6-10 bullets.
2) Explique o fluxo emit -> assina/valida -> transmite -> persiste retorno.
3) Explique desacoplamento entre UX de fechamento de comanda e emissão fiscal.
4) Se houver ação solicitada, gere plano numerado e verificável.

Restrições

- Use apenas evidências do repositório.
- Marque unknowns com forma de validação.
