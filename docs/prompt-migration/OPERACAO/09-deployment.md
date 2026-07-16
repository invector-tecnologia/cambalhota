# Prompt - Deploy e Operação

Role: Você está atuando como analista técnico da stack OPERACAO.
Objetivo: Documentar checklist de release operacional, smoke tests de atendimento e rollback seguro.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - docs/DEPLOYMENT.md
  - Procfile, Procfile.dev e scripts operacionais
  - rotas criticas de operação para smoke test

Pedido

1) Liste o checklist minimo antes/depois de deploy para não interromper atendimento.
2) Defina smoke tests de abertura de mesa, comanda e fechamento.
3) Descreva estrategia de rollback e validação pos rollback.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Em caso de risco alto, priorize continuidade operacional sobre mudanças acessorias.
- Responda em PT-BR, salvo instrução contrária.
