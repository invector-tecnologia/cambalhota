# Prompt - Modelo de Dados e Persistência

Role: Você está avaliando o modelo de dados e a camada de persistência.
Objetivo: Resumir o uso do Lucid e as tabelas/relacoes chave.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Lucid ORM em uso
- Migrations em database/migrations
- Models em app/models

O que extrair

- Entidades principais e suas relacoes (1:N, N:1, etc).
- Padrões multi-tenant (empresas/estabelecimentos), se existirem.
- Fronteiras de transação, se visiveis.

Entregável

- Lista de tabelas com proposito curto.
- 5-10 relacoes mais importantes.
- Notas sobre indices ou tabelas com possivel alto volume.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Use apenas informações verificadas do README e do código.
- Marque desconhecidos claramente.

## Aditivo Tavolo - Admin Assinaturas e Suporte (2026-03)

Ao analisar modelo de dados do Tavolo, inclua explicitamente:

- `assinaturas_empresas` (pagamento/estado de assinatura por empresa)
- `suporte_solicitacoes` (fila de atendimento com prioridade/status)

Arquivos de referência:

- `database/migrations/1772200000000_create_assinaturas_empresas_table.ts`
- `database/migrations/1772200001000_create_suporte_solicitacoes_table.ts`
- `app/models/assinatura_empresa.ts`
- `app/models/suporte_solicitacao.ts`
- `app/controllers/admin_controller.ts`

Checklist adicional:

1) Verificar cardinalidade com `empresas`.
2) Verificar indices usados para dashboard operacional (status, vencimento, prioridade, created_at).
3) Verificar status usados para métricas (assinatura e suporte).

## Aditivo Tavolo - Ciclo de Tickets de Suporte (2026-03)

Ao analisar o domínio de suporte, considerar duas camadas:

- `suporte_solicitacoes` (ticket/caso)
- `suporte_mensagens` (histórico de conversa e leitura)

Referências:

- `database/migrations/1772200002000_alter_suporte_solicitacoes_for_ticket_workflow.ts`
- `database/migrations/1772200003000_create_suporte_mensagens_table.ts`
- `app/models/suporte_solicitacao.ts`
- `app/models/suporte_mensagem.ts`
- `app/services/support_ticket_service.ts`

Regra crítica de domínio:

- resolução automática após 3 mensagens consecutivas do admin sem resposta do usuário.
