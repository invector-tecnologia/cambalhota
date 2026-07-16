# Prompt - Modulos e Resolução

Role: Você está avaliando o sistema de modulos do TypeScript.
Objetivo: Explicar import/export, formatos de módulo e resolução.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Suporte a ES Modules e CommonJS.
- Opcoes module e moduleResolution influenciam emit e lookup.
- Interop: esModuleInterop, allowSyntheticDefaultImports, verbatimModuleSyntax.
- Imports de JSON e extensoes TS.

Fontes

- <https://www.typescriptlang.org/docs/handbook/2/modules.html>
- <https://www.typescriptlang.org/tsconfig>
- <https://www.typescriptlang.org/docs/handbook/compiler-options.html>

Entregável

- Diferenças entre ESM e CJS no TS.
- Como module/moduleResolution afetam runtime e bundlers.
- Guidelines para Node moderno (node16/nodenext) vs bundler.
- Riscos comuns de interop e como mitigar.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Baseie afirmações nas fontes listadas.
- Evite especular sobre runtime não documentado.
