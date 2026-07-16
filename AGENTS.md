# AGENTS.md — Tavolo Restaurant Management System

## Identity
- **Project:** Tavolo — Full-stack restaurant ERP (AdonisJS v6 + PostgreSQL + Edge.js)
- **Language:** TypeScript (strict), SQL
- **Framework:** AdonisJS v6 (Lucid ORM, Vine.js validation, Edge.js templates)
- **Deploy:** Heroku (web dyno + release phase for migrations)
- **Test runner:** Japa (unit + functional suites)

## Architecture Rules
1. Controllers are thin — business logic lives in `app/services/`.
2. All database access goes through Lucid ORM models in `app/models/`.
3. Validation uses Vine.js validators (not inline validation).
4. Views are Edge.js templates in `resources/views/`.
5. Routes are defined in `start/routes.ts` — always verify controller#method exists.
6. Multi-tenant: most entities scope to `empresa_id`.
7. Fiscal module is critical-path — never modify without build verification.
8. Database Schema: NEVER use the Postgres Database Schema `public`. Always hardcode the schema to `tavolo` in all migrations (e.g., `this.schema.withSchema('tavolo').createTable(...)`).

## Quality Gates (run before every PR)
```bash
npm run typecheck          # Zero TS errors
npm run lint               # Zero lint errors  
npm test                   # All unit tests pass
npm run build              # Production build succeeds
```

## Naming Conventions
- Models: PascalCase singular Portuguese (`CardapioProduto`, `FiscalNote`)
- Controllers: snake_case plural Portuguese + `_controller` suffix
- Migrations: timestamp prefix, snake_case
- Services: snake_case + `_service` suffix (e.g., `fiscal_emission_workflow.ts`)
- Tables: snake_case plural Portuguese (`cardapio_produtos`, `fiscal_notes`)

## Critical Paths — Extra Caution Required
- `app/services/fiscal_*` — SEFAZ integration, XML signing, NFC-e emission
- `app/services/voice_*` — OpenAI API integration (BYOK encrypted keys)
- `database/migrations/` — Never modify existing migrations, only add new ones
- `start/routes.ts` — Route→controller audit required after changes

## Documentation Protocol
- Update `docs/CHANGELOG.md` for every feature/fix
- Run `npx -y markdownlint-cli2 "docs/**/*.md" "*.md"` before committing docs
- If adding a new module, create prompt set: `npm run prompts:bootstrap-stack -- <NAME>`

## Environment
- Dev: `npm run dev` (HMR via Vite)
- Test: `npm test` (Japa runner, `NODE_ENV=test`)
- Build: `npm run build` → `node build/bin/server.js`
- Fiscal key: `FISCAL_ENCRYPTION_KEY` (AES-256, 32 bytes hex)

## Global Rules
- **Model Selection & Consent:** For every task or plan, the agent must suggest which Gemini model tier and category is best suited to execute the task, explaining the rationale. The agent must wait for approval before editing files.
- **Linting:** Always run ESLint after the implementation.
