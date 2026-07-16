---
name: tavolo-voice
description: "Use when working on the voice ordering pipeline (Whisper STT -> GPT NLU -> action execution)."
---

# Tavolo Voice Ordering Skill

## Use When
- Modifying voice intent parsing logic
- Working with OpenAI Whisper or GPT integrations
- Updating BYOK (Bring Your Own Key) crypto logic
- Debugging voice command failures

## Critical Files
- `app/services/voice_transcriber.ts`
- `app/services/voice_intent_parser.ts`
- `app/services/voice_action_executor.ts`
- `app/services/voice_ordering_service.ts`
- `app/models/voice_config.ts`
- `app/helpers/voice_crypto.ts`

## Workflow
1. Voice requires strict preview/confirm flows.
2. Ensure API keys are handled securely via `voice_crypto`.
3. Test against common misinterpretations in intents.

## Outputs
- Accurate intent parsing, secure key management.
