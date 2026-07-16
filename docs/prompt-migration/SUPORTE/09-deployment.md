# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack SUPORTE.
Objetivo: Documentar checklist de release de suporte com smoke tests de ciclo conversacional.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - docs/SUPORTE_TICKETS_CICLO.md
  - rotas de usuario e admin de tickets para smoke test

Pedido

1) Defina checklist pre e pos deploy para módulo de suporte.
2) Liste smoke tests de abertura, resposta e notificacao.
3) Descreva rollback e validação de continuidade das conversas.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Validar no pos-deploy a segregacao correta entre rotas de usuario e admin.
- Responda em PT-BR, salvo instrução contrária.
