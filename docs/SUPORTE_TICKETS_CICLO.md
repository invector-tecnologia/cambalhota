# Suporte por Ticket: Ciclo Completo

## Rotas relacionadas

- Usuário:
  - `/suporte/tickets`
  - `/suporte/tickets/novo`
  - `/suporte/tickets/:id`
- Admin:
  - `/admin/support-tickets`
  - `/admin/support-tickets/:id`

## Regras de negócio implementadas

1. O usuário pode abrir ticket e iniciar conversa com suporte.
2. O ticket fica disponível para administração no painel admin.
3. A resposta do admin aparece como notificação para o usuário:
   - badge no menu lateral do dashboard;
   - alerta com lista de mensagens não lidas no dashboard;
   - contador no índice de tickets do usuário.
4. O usuário pode responder indefinidamente enquanto o ticket estiver aberto.
5. O usuário pode cancelar o ticket a qualquer momento antes da conclusão.
6. O admin pode sugerir solução a qualquer momento.
7. O ticket só é resolvido quando:
   - o usuário confirma a solução, **ou**
   - existem 3 mensagens consecutivas do admin sem resposta do usuário (auto-resolução).

## Indicador de disponibilidade (UI)

- Nas telas de ticket do usuário (`/suporte/tickets*`), o indicador de conectividade exibe contexto explícito:
  - **"Suporte online"** quando conectado;
  - **"Suporte offline (modo local)"** quando sem conexão.
- O indicador não é exibido na área admin (`/admin/support-tickets*`).
- O posicionamento é ajustado para o topo da tela no contexto de tickets do usuário, evitando conflito visual com ações de resposta/cancelamento.

## Padrão de layout (UI)

- A listagem em `/suporte/tickets` deve seguir o mesmo padrão visual das telas principais de gestão (ex.: `/cardapio/produtos`):
  - header com identidade da tela e ações primárias;
  - conteúdo em card com tabela responsiva;
  - estado vazio com CTA para criação de ticket.

## Modelo de dados

### `suporte_solicitacoes` (ticket)

- Identificação e vínculo: `id`, `protocolo`, `empresa_id`, `opened_by_user_id`
- Conteúdo: `assunto`, `mensagem`, `categoria`, `prioridade`
- Fluxo: `status`, `admin_no_reply_streak`
- Auditoria de ciclo: `solucao_sugerida_em`, `ultima_interacao_usuario_em`, `ultima_interacao_admin_em`, `cancelado_em`, `resolvido_em`, `resolvido_por`, `resolucao_motivo`

### `suporte_mensagens` (conversa)

- `ticket_id`, `sender_tipo` (`usuario`, `admin`, `sistema`), `sender_user_id`
- `mensagem`
- Leitura/notificação: `lida_usuario_em`, `lida_admin_em`

## Status utilizados

- `aberto`
- `aguardando_usuario`
- `aguardando_admin`
- `em_andamento`
- `sugestao_solucao`
- `resolvido`
- `fechado`
- `cancelado`

## Arquivos principais

- Regras de ciclo:
  - `app/services/support_ticket_service.ts`
- Usuário:
  - `app/controllers/support_tickets_controller.ts`
  - `resources/views/support_tickets/index.edge`
  - `resources/views/support_tickets/create.edge`
  - `resources/views/support_tickets/show.edge`
- Admin:
  - `app/controllers/admin_support_tickets_controller.ts`
  - `resources/views/admin/support_tickets/index.edge`
  - `resources/views/admin/support_tickets/show.edge`
- Notificação no dashboard:
  - `app/controllers/dashboard_controller.ts`
  - `resources/views/dashboard/index.edge`
