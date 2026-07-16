# System Prompt - Agentes tavolo

## Stack Tecnológica

- **Backend:** AdonisJS v6, Lucid ORM, Vine.js, Edge.js, TypeScript
- **Frontend:** Tailwind CSS, Alpine.js (renderizado via Edge.js)
- **Infra:** Heroku (web dyno) + Heroku Postgres
- **CI:** npm run typecheck, npm run lint, npm test

## Regras de Banco de Dados

- Usar **sempre** a env var `DATABASE_SCHEMA` para definir o schema; **NUNCA** usar `public`.
- Migrations devem iniciar explicitamente com `this.schema.withSchema('tavolo')`.
- Usar acesso a dados exclusivamente através do Lucid ORM Models.
- Multi-tenant: isolamento de dados por `empresa_id` em todas as queries referentes aos restaurantes.

## Segurança

- Autenticação de usuários/funcionários.
- Hierarquia de papéis (do mais ao menos privilegiado):
  `superadmin > admin > gerente > caixa > garçom`
- Operações privilegiadas (CRUD de usuários, estornos, exclusão de comandas) **devem** gerar audit log.

## Convenções de Código

- Arquitetura MVC em camadas: `Router → Controllers → Services → Models`.
- Testes unitários/funcionais (Japa) **devem** ser escritos junto com o código de produção — nunca depois.
- `npm run lint` sem warnings; `npm run typecheck` sem erros.
- Nomes de models em PascalCase; controllers e tabelas em snake_case plural/singular (convenções Adonis).

## Pré-requisito ADR

> **Nenhum código de produção pode ser gerado sem um ADR aprovado.**

ADRs ficam em `docs/engineering/adrs/` no formato `NNNN-titulo.md`.
Antes de implementar qualquer feature, verificar se o ADR correspondente existe e está com status "Aceito".

## Modelo de Aprovação

1. Para cada tarefa, **sugerir** o modelo Gemini mais adequado (Flash, Pro, etc.) com justificativa.
2. **Aguardar aprovação explícita** do usuário antes de editar qualquer arquivo em `app/` ou `resources/`.
3. Apresentar diff resumido antes de aplicar mudanças destrutivas.

## Referências

- [Constituição do Projeto](docs/engineering/constitution.md)
- [Escopo do Produto](docs/scope.md)
- [Instrumentação e Observabilidade](docs/instrumentation.md)

## Agentes Operacionais

- [Agente Arquitetura](.agents/arch/agent.md) — ADRs e architecture_map
- [Agente Engenharia](.agents/eng/agent.md) — Código AdonisJS + TypeScript + Edge.js
- [Agente Produto](.agents/prod/agent.md) — features_map e roadmaps
- [Agente QA](.agents/qa/agent.md) — Planos de teste Gherkin e validação
