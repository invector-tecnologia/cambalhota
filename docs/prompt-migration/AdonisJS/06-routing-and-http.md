# Prompt - Roteamento e Fluxo HTTP

Role: Você está revisando a camada HTTP.
Objetivo: Resumir grupos de rotas, gates de auth e ordem de middleware.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Rotas: start/routes.ts
- Middleware: start/kernel.ts e app/middleware/*

Entregável

- Rotas publicas vs protegidas.
- Fluxo de auth para login por sessao.
- Rotas de API e padrões de nomeacao.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Foque em estrutura, não em listagem exaustiva.
- Use referencias de arquivos para as afirmações.

## Aditivo Tavolo - Dashboard Admin Operacional (2026-03)

Ao revisar rotas/admin, incluir o fluxo de monitoramento:

- dashboard em `/admin` com métricas de assinatura, novas empresas e suporte;
- gestão via CRUD genérico em `/admin/:model` para:
  - `assinaturas_empresas`
  - `suporte_solicitacoes`

Arquivos de referência:

- `start/routes.ts`
- `app/controllers/admin_controller.ts`
- `resources/views/admin/index.edge`

Validar também:

1) proteção por `middleware.auth()` + `middleware.superadmin()`;
2) consistência dos links do dashboard para `admin.list`;
3) impacto de filtros por empresa no CRUD genérico.

## Aditivo Tavolo - Rotas de Ticket Conversacional (2026-03)

Fluxos HTTP adicionais a considerar:

- Usuário autenticado:
  - `/suporte/tickets`
  - `/suporte/tickets/novo`
  - `/suporte/tickets/:id`
  - ações: responder, cancelar, confirmar solução, rejeitar solução.

- Admin (superadmin):
  - `/admin/support-tickets`
  - `/admin/support-tickets/:id`
  - ações: responder, sugerir solução.

Referências:

- `start/routes.ts`
- `app/controllers/support_tickets_controller.ts`
- `app/controllers/admin_support_tickets_controller.ts`
