# Prompt - Configuração de Runtime (tsconfig)

Role: Você está auditando configuração de build e type-checking.
Objetivo: Resumir opcoes de tsconfig e impactos em runtime e DX.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- tsconfig.json define root files e compiler options.
- Opcoes criticas: target, module, moduleResolution, lib, strict, outDir.
- Build em monorepo: references e composite.
- Bases prontas: tsconfig/bases.

Fontes

- <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>
- <https://www.typescriptlang.org/tsconfig>
- <https://www.typescriptlang.org/docs/handbook/project-references.html>
- <https://www.typescriptlang.org/docs/handbook/compiler-options.html>

Entregável

- Lista de opcoes essenciais e o que controlam.
- Riscos de defaults (module/target/strict/noEmitOnError).
- Como organizar references/composite.
- Recomendar um baseline com base no runtime alvo.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Amarre cada afirmação a uma fonte.
- Não invente opcoes ausentes.
