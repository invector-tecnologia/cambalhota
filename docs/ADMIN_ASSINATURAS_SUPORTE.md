# Dashboard Admin: Assinaturas, Novas Empresas e Suporte

## Rotas relacionadas

- `/admin`
- `/admin/assinaturas_empresas`
- `/admin/suporte_solicitacoes`
- `/admin/empresas`

## Objetivo

Adicionar visibilidade operacional para equipe administrativa com foco em:

- acompanhamento do pagamento da assinatura por empresa;
- registro de novas empresas;
- acompanhamento de pedidos de suporte.

## O que foi implementado

### 1) Assinaturas de empresas

- Nova tabela: `assinaturas_empresas`.
- Novo model: `AssinaturaEmpresa` (`app/models/assinatura_empresa.ts`).
- Dados suportados:
  - `plano`, `status`, `valor_mensal`, `moeda`;
  - `proximo_vencimento`, `ultimo_pagamento_em`, `dias_tolerancia`;
  - `gateway_ref`, `observacoes`.
- Relação: `empresa_id` (FK para `empresas.id`).

### 2) Solicitações de suporte

- Nova tabela: `suporte_solicitacoes`.
- Novo model: `SuporteSolicitacao` (`app/models/suporte_solicitacao.ts`).
- Dados suportados:
  - contato (`nome_contato`, `email_contato`), `assunto`, `mensagem`;
  - `categoria`, `prioridade`, `status`, `canal`;
  - `responsavel`, `resolvido_em`.
- Relação opcional com empresa via `empresa_id`.

### 3) Dashboard administrativo

No dashboard `/admin` foram adicionados:

- **KPIs de assinatura**
  - assinaturas ativas;
  - assinaturas vencendo (janela de 7 dias);
  - assinaturas inadimplentes.
- **KPI de crescimento**
  - novas empresas nos últimos 30 dias.
- **KPIs de suporte**
  - solicitações abertas;
  - solicitações urgentes.
- **Listas operacionais**
  - empresas recentes;
  - assinaturas em atenção;
  - suporte recente.

### 4) CRUD no admin

Os dois novos modelos foram integrados ao CRUD genérico de admin:

- listagem, criação, edição, visualização e exclusão;
- preloads de `empresa` quando aplicável;
- busca e filtro por `empresa_id`.

## Migrations

- `database/migrations/1772200000000_create_assinaturas_empresas_table.ts`
- `database/migrations/1772200001000_create_suporte_solicitacoes_table.ts`

## Observações operacionais

- O dashboard utiliza os status de assinatura (`trial`, `active`, `past_due`, `canceled`) para classificação de atenção.
- O dashboard utiliza os status de suporte (`aberto`, `em_andamento`, `aguardando_cliente`, `resolvido`, `fechado`) para métricas de fila.
- O fluxo atual de criação/edição no admin permanece via JSON no CRUD genérico.
