# Prompt - Modelo de Dados

Role: Você está atuando como analista técnico da stack TRANSVERSAL.
Objetivo: Identificar campos e estruturas compartilhadas que suportam regras transversais.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Fontes prioritárias:
  - models/migrations com colunas de auditoria e padrões comuns
  - docs/TIMEZONE_USUARIO.md
  - docs/formatacao-numerica.md

Pedido

1) Liste campos transversais relevantes (datas, timezone, auditoria, valores).
2) Identifique padrões de nomeacao e consistência entre tabelas.
3) Aponte riscos de padrão divergente entre modulos.
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- Evitar inferir padrão global a partir de evidência isolada.
- Responda em PT-BR, salvo instrução contrária.
