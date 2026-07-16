# Prompt - Qualidade, Strictness e JS Checking

Role: Você está definindo criterios de qualidade de tipos.
Objetivo: Recomendar configuracoes de strictness e boas praticas de validação.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Strictness e flags: strict, noImplicitAny, strictNullChecks, noImplicitThis.
- Flags de qualidade: noImplicitReturns, noFallthroughCasesInSwitch, noUncheckedIndexedAccess.
- JS checking: allowJs, checkJs, @ts-check e JSDoc.

Fontes

- <https://www.typescriptlang.org/docs/handbook/2/basic-types.html>
- <https://www.typescriptlang.org/tsconfig>
- <https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html>
- <https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html>
- <https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html>

Entregável

- Perfil recomendado de strictness e por que.
- Quando habilitar checkJs e como usar @ts-check.
- Riscos comuns ao migrar JS -> TS e como reduzir.
- Sugestao de gates para CI (ex: noEmitOnError + strict).
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Baseie tudo nas fontes listadas.
- Evite aconselhamento generico sem ancoragem.
