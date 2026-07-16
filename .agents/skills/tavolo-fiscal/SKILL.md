---
name: tavolo-fiscal
description: "Use when working on NFC-e/NF-e emission, SEFAZ integration, fiscal config, XML signing, or any fiscal module code."
---

# Tavolo Fiscal Skill

## Use When
- Modifying fiscal services (fiscal_emission_workflow, fiscal_routing_service, etc.)
- Working with SEFAZ XML/SOAP communication
- Changing fiscal_notes or fiscal_configs models/migrations
- Debugging NFC-e/NF-e emission failures

## Critical Files
- `app/services/fiscal_emission_workflow.ts` — Main orchestrator
- `app/services/fiscal_routing_service.ts` — UF-specific SEFAZ routing
- `app/services/fiscal_signer.ts` — XML digital signing (A1 cert)
- `app/services/fiscal_xml_validator.ts` — Schema validation
- `app/services/fiscal_transmitter.ts` — SEFAZ SOAP transmission
- `app/models/fiscal_note.ts` — Note lifecycle
- `app/models/fiscal_config.ts` — Per-empresa fiscal setup

## Workflow
1. Always run `npm run build` before and after changes — fiscal code is critical path.
2. Review `docs/FISCAL_ENGINE_GUIDE.md` and `docs/FISCAL_ENGINE_EXAMPLES.md` for context.
3. Test with `npm test -- tests/unit/fiscal_routing_service.spec.ts`.
4. Never modify encryption key handling without reviewing `FISCAL_ENCRYPTION_KEY_CONFIG.md`.

## Outputs
- Build passes, fiscal tests pass, no regression in XML signing or SEFAZ routing.
