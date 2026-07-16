# Prompt - Módulo Fiscal

Role: Você está explicando o fiscal engine para um novo engenheiro.
Objetivo: Resumir o fluxo do módulo fiscal e restrições de segurança.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Provider: providers/fiscal_provider.ts
- Service: app/services/fiscal_service.ts
- Models relacionados: app/models/fiscal_* (se existirem)
- Env vars: start/env.ts (FISCAL_*)

Entregável

- Fluxo de alto nivel para emissão e cancelamento de NFC-e.
- Como certificados são carregados e cacheados.
- Como segredos são criptografados e armazenados.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Cite arquivos exatos para cada afirmação.
- Aponte ausencia de integração com fila assincrona, se existir.
