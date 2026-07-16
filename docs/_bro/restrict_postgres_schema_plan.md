## Goal Description
The objective is to strictly enforce the use of the `tavolo` Postgres Database Schema across the project, explicitly preventing the use of the default `public` schema. This involves hardcoding the `tavolo` schema in all existing migrations, enforcing it for all future migrations, and instrumenting the AI harness (`AGENTS.md`) to comply with this restriction.

## User Review Required
> [!WARNING]  
> Modifying existing migrations contradicts the `AGENTS.md` rule: *"Never modify existing migrations, only add new ones"*. However, as explicitly requested, I will rewrite all existing migrations in `database/migrations/` to hardcode `.withSchema('tavolo')`. Please confirm this exception to the rule before I proceed.

## Proposed Changes

### 1. AI Harness Instrumentation (`AGENTS.md`)
I will add a new rule to the `AGENTS.md` file under the `Architecture Rules` and `Critical Paths` sections to instruct the AI to **NEVER** use the Postgres `public` schema, and to always explicitly hardcode `.withSchema('tavolo')` when creating or modifying tables in future migrations.

#### [MODIFY] AGENTS.md
```diff
 ## Architecture Rules
 ...
 6. Multi-tenant: most entities scope to `empresa_id`.
 7. Fiscal module is critical-path — never modify without build verification.
+8. Database Schema: NEVER use the Postgres Database Schema `public`. Always hardcode the schema to `tavolo` in all migrations (e.g., `this.schema.withSchema('tavolo').createTable(...)`).
```

### 2. Hardcode Schema in Existing Migrations (`database/migrations/`)
I will run a script to replace all occurrences of `this.schema.createTable`, `this.schema.dropTable`, `this.schema.alterTable`, etc., with their `withSchema('tavolo')` equivalents across all 11 existing migration files.

#### [MODIFY] database/migrations/*.ts (except 1900000000001)
Example transformation for `1900000000002_create_core_tables.ts`:
```diff
 export default class extends BaseSchema {
   async up() {
-    await this.schema.createTable('roles', (table) => {
+    await this.schema.withSchema('tavolo').createTable('roles', (table) => {
       ...
     })
   }
 
   async down() {
-    await this.schema.dropTableIfExists('roles')
+    await this.schema.withSchema('tavolo').dropTableIfExists('roles')
   }
 }
```

## Verification Plan

### Automated Tests
```bash
# Verify there are no typescript errors after the change
npm run typecheck

# Verify linting passes
npm run lint

# Run the test suite to ensure migrations and database connections work correctly
npm test
```

### Manual Verification
1. Review the modified migration files to ensure `.withSchema('tavolo')` was correctly applied.
2. Review `AGENTS.md` to ensure the new AI harness instruction is present.
