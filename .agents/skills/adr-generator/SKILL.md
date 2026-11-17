---
name: adr-generator
description: >
  Generates standardized Architecture Decision Records (ADRs) for the tavolo project.
  Activate when the arch agent needs to create a new ADR, plan a technical decision,
  or document architectural trade-offs in the AdonisJS stack.
---

# ADR Generator (Architecture Decision Records)

This skill guides the [arch](../arch/agent.md) agent in creating ADRs in the tavolo project, ensuring consistency with the established architecture (AdonisJS, Lucid, Edge.js, Tailwind).

## 1. Location and Naming

- **Directory**: `docs/engineering/adrs/`
- **File format**: `NNN_titulo_descritivo_curto.md`
  - `NNN` = 3-digit sequential number (e.g.: `001`, `002`, `003`).
  - The title must be snake_case or kebab-case without special characters.
  - Example: `docs/engineering/adrs/005_emissao_fiscal_nfe.md`.

## 2. Mandatory Template

Every ADR must follow the structure below. **No section may be omitted.**

```markdown
# ADR-NNN: Decision Title (E.g.: Caching Strategy for Fiscal Reports)

- **Status:** Proposto | Aceito | Implementado | Substituído | Arquivado
- **Date:** YYYY-MM-DD
- **Authors:** arch agent (Tavolo AI)

## 1. Context
- What is the business problem or technical challenge?
- Describe the scenario in the context of a restaurant/ERP (e.g.: Waiters are hitting bottlenecks when closing tabs, offline POS).

## 2. Decision
- What are we actually deciding?
- Architecture, AdonisJS class flow, table structure, integration (e.g.: SEFAZ).
- (Optional, but recommended) Mermaid diagram of the proposed solution (C4 or Sequence flow).

## 3. Trade-offs Considered
- Alternative A: Advantages x Disadvantages.
- Alternative B: Advantages x Disadvantages.
- Why was the Decision chosen over the others?

## 4. Consequences
- **Positive:** Gains obtained from the adoption.
- **Negative/Risks:** Technical debt, learning curve, complexity introduced.

## 5. References
- Links to issues, features_map, AdonisJS docs, etc.
```

## 3. Project Architectural Constraints (AdonisJS Stack)

When proposing solutions, the **arch** agent must unconditionally respect the defined technology base:

1. **Backend**: AdonisJS v6 (Node.js + TypeScript). Business rules live in `app/services/`.
2. **Database**: PostgreSQL with a restricted schema (`tavolo`). ORM: Lucid ORM. Migrations are mandatory.
3. **Validation**: Vine.js.
4. **Frontend**: Server-side rendering via Edge.js + Tailwind CSS.
5. **Multi-tenancy**: All tables that hold restaurant data must be linked to an `empresa_id`, and isolation must be guaranteed at the Service or Middleware level.
6. **Deploy**: Deploy is on Heroku. Long-running tasks and background jobs must not block the Web Dyno (if that is the case, they must use bullmq/redis or suitable managed services).

## 4. Creation Flow

1. Analyze the business request.
2. Identify the technology solution in the AdonisJS/Node.js ecosystem.
3. Write the ADR using the `write_to_file` command.
4. Set `Status: Proposto`.
5. Present a summary for validation (if interactive) or advance the status to `Aceito` in the asynchronous flow.
