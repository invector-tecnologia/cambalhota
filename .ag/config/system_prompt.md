# System Prompt - Agentes Veterin

## Stack Tecnológica

- **Backend:** Rust — Actix-web 4.x, sqlx, serde, tracing, jsonwebtoken, thiserror
- **Frontend:** Flutter — Riverpod/Bloc, go_router, dark-mode, responsivo
- **Infra:** Heroku (dyno) + Heroku Postgres
- **CI:** cargo clippy, cargo test, flutter analyze, flutter test

## Regras de Banco de Dados

- Usar **sempre** a env var `DATABASE_SCHEMA` para definir o schema; **NUNCA** usar `public`.
- Migrations devem iniciar com `SET search_path TO ${DATABASE_SCHEMA};`.
- Usar prepared statements via `sqlx::query!` / `sqlx::query_as!` — sem SQL dinâmico concatenado.
- Multi-tenant: isolamento de dados por `tenant_id` em todas as queries.

## Segurança

- Autenticação via JWT com claims obrigatórios: `user_id`, `tenant_id`, `role`, `exp`.
- Hierarquia de papéis (do mais ao menos privilegiado):
  `superadmin > admin > coordenador > voluntário > veterinário > visualização`
- Operações privilegiadas (CRUD de usuários, alteração de papéis, exclusão de dados) **devem** gerar audit log.

## Convenções de Código

- Arquitetura DDD em camadas: `Handlers → Services → Repositories`.
- Testes unitários **devem** ser escritos junto com o código de produção — nunca depois.
- `cargo clippy` sem warnings; `flutter analyze` sem erros.
- Nomes de arquivos e módulos em snake_case (Rust) e snake_case (Dart).

## Pré-requisito ADR

> **Nenhum código de produção pode ser gerado sem um ADR aprovado.**

ADRs ficam em `docs/engineering/adrs/` no formato `NNNN-titulo.md`.
Antes de implementar qualquer feature, verificar se o ADR correspondente existe e está com status "Aceito".

## Modelo de Aprovação

1. Para cada tarefa, **sugerir** o modelo Gemini mais adequado (Flash, Pro, etc.) com justificativa.
2. **Aguardar aprovação explícita** do usuário antes de editar qualquer arquivo em `backend/` ou `frontend/`.
3. Apresentar diff resumido antes de aplicar mudanças destrutivas.

## Referências

- [Constituição do Projeto](docs/engineering/constitution.md)
- [Escopo do Produto](docs/scope.md)
- [Instrumentação e Observabilidade](docs/instrumentation.md)

## Agentes Operacionais

- [Agente Arquitetura](.agents/arch/agent.md) — ADRs e architecture_map
- [Agente Engenharia](.agents/eng/agent.md) — Código Rust + Flutter + testes
- [Agente Produto](.agents/prod/agent.md) — features_map e roadmaps
- [Agente QA](.agents/qa/agent.md) — Planos de teste Gherkin e validação
