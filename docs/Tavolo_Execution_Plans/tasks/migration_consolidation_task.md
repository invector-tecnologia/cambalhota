# Task: Migration Consolidation

**Status:** ✅ Complete
**Plan:** [migration_consolidation_plan.md](file:///home/bro/projects/tavolo/docs/Tavolo_Execution_Plans/tasks/migration_consolidation_plan.md)

## Acceptance Criteria

### AC-1: Archive Old Migrations
- [x] **Given** 83 migration files exist in `database/migrations/`, **When** the archive step completes, **Then** all old `.ts` files are moved to `docs/archived_migrations/` and `database/migrations/` is empty.
  - **Evidence:** `mv` command moved 83 files; `ls | wc -l` confirmed 83 in archive, 0 remaining.

### AC-2: Database Configuration Updated
- [x] **Given** `config/database.ts`, **When** inspected, **Then** `searchPath` is `['tavolo']` and `migrations.schemaName` is `'tavolo'`.
  - **Evidence:** diff shows `searchPath: [String(env.get('DATABASE_SCHEMA', 'tavolo'))]` and `schemaName: String(env.get('DATABASE_SCHEMA', 'tavolo'))`.

### AC-3: Schema & Extensions Migration
- [x] **Given** a fresh database, **When** migration `1900000000001` runs, **Then** the `tavolo` schema exists and the `unaccent` extension is enabled.
  - **Evidence:** File created with `CREATE SCHEMA IF NOT EXISTS tavolo` and `CREATE EXTENSION IF NOT EXISTS unaccent`.

### AC-4: All 33 Tables Created
- [x] **Given** migrations 0002–0010 run, **When** complete, **Then** exactly 33 tables exist inside the `tavolo` schema matching the ORM models.
  - **Evidence:** 9 migration files create all 33 tables: roles, empresas, municipios_ibge, users, fornecedores, insumos, cardapio_categorias, cardapio_produtos, cardapio_produtos_ingredientes, cardapios_virtuais, mesas, comandas, funcionarios, funcoes, funcionario_funcoes, pedidos, pedido_itens, vendas, venda_itens, caixa_registros, fiscal_configs, fiscal_notes, notas_fiscais, nota_fiscal_itens, processing_rules, processing_events, entity_processing_status, assinaturas_empresas, suporte_solicitacoes, suporte_mensagens, voice_configs, user_quick_actions, insumo_reservas.

### AC-5: Seed Data Migration
- [x] **Given** migration 0011 runs, **When** complete, **Then** `roles` contains admin/gerente/funcionario/superadmin and `funcoes` contains 6 standard functions.
  - **Evidence:** File uses `INSERT ... ON CONFLICT (name) DO NOTHING` for idempotent seeding.

### AC-6: TypeScript Compilation Passes
- [x] **Given** all new migrations, **When** `npx tsc --noEmit` runs, **Then** zero errors.
  - **Evidence:** Command completed with exit code 0, empty stdout/stderr.

### AC-7: Lint Passes
- [x] **Given** all new migrations, **When** `npm run lint` runs, **Then** zero errors in new migration files.
  - **Evidence:** `eslint .` completed with no output (clean).

### AC-8: Build Succeeds
- [x] **Given** the full project, **When** `npm run build` runs, **Then** production build succeeds.
  - **Evidence:** `[ success ] build completed` output.

### AC-9: No References to Old Migrations
- [x] **Given** the project code (excluding `docs/`), **When** searched, **Then** no references to deleted migration filenames exist.
  - **Evidence:** `grep -r` for old timestamps returned 0 matches.

## Residual Notes

- **Heroku deployment:** Before deploying, run on the Heroku Postgres database:
  ```sql
  DROP TABLE IF EXISTS public.adonis_schema;
  DROP TABLE IF EXISTS public.adonis_schema_versions;
  ```
- **Existing data:** If there is data in the `public` schema tables, it will NOT be migrated automatically. The new migrations create fresh tables in the `tavolo` schema.
