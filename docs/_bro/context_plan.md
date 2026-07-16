## Goal Description
The goal of this task was to explore and contextualize myself with the `docs`, `.agents`, `.github`, and source code directories of the Tavolo project. I have successfully gathered the required context.

## Findings: Tavolo Project Context

Tavolo is a **full-stack restaurant ERP** built with **AdonisJS v6**, **PostgreSQL**, and **Edge.js** for server-rendered views. The project uses the Lucid ORM, Vine.js for validation, and follows a multi-tenant architecture. 

### Documentation (`docs/`)
- Contains a comprehensive `FEATURE_MAP.md` dividing the project into 8 main domains: Almoxarifado, Cardápio, Operação, Financeiro, Fiscal, Voice Ordering, Suporte & Admin, and Platform & Infrastructure.
- Highlights AI-driven Voice Ordering and offline-first Fiscal contingencies as its main competitive edge in the SME restaurant market.
- Outlines clear guidelines for prompt migration and AI knowledge sharing (`00-Prompt-de-inicio.md`).

### Agent Skills (`.agents/skills/`)
The project utilizes specialized agent skills scoped to its domains, such as:
- `tavolo-fiscal`: For SEFAZ integration, XML signing, and NFC-e emission.
- `tavolo-voice`: For the AI ordering pipeline (Whisper STT -> GPT NLU -> execution).
- `tavolo-operations`: For tables, orders, and kitchen workflows.
- `tavolo-financial`, `tavolo-inventory`, `rag-operations`, `spec-driven-dev`, and `github-delivery`.

### CI/CD Setup (`.github/`)
- A single `ci.yml` is present, enforcing quality gates.
- According to `AGENTS.md`, PRs require passing typechecks, linting, tests, and production build checks.

### Code Architecture (`app/`)
- **Controllers**: Thin layer passing requests to services. Contains numerous controllers mapping to the features (e.g., `fiscal_controller.ts`, `voice_ordering_controller.ts`, `pedidos_controller.ts`).
- **Models**: Defines the database schema and multi-tenancy rules via `Lucid` (e.g., `venda.ts`, `pedido.ts`, `fiscal_note.ts`, `empresa.ts`).
- **Services**: Thick layer containing business logic. Notable services include:
  - `fiscal_emission_workflow.ts`, `fiscal_signer.ts`, `fiscal_transmitter.ts` for tax operations.
  - `voice_action_executor.ts`, `voice_intent_parser.ts`, `voice_ordering_service.ts` for AI ordering logic.
  - `processing_engine.ts` for generic asynchronous and event-based background processing.

## User Review Required
No code modifications are required for this plan. Please review this summary to ensure my understanding aligns with your expectations.

## Verification Plan
N/A - Context acquisition is complete.
