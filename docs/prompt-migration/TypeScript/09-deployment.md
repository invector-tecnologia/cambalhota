# Prompt - Build, Emit e Integração com Tooling

Role: Você está planejando build e distribuicao de código TypeScript.
Objetivo: Explicar opcoes de build, emit e integração com bundlers.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- tsc CLI e flags de build e watch.
- Emissão de JS e d.ts (declaration, emitDeclarationOnly, outDir).
- Integração com Babel, Rollup, Vite, Webpack, MSBuild.
- Publicacao e uso de declaration files.

Fontes

- <https://www.typescriptlang.org/docs/handbook/compiler-options.html>
- <https://www.typescriptlang.org/tsconfig>
- <https://www.typescriptlang.org/docs/handbook/integrating-with-build-tools.html>
- <https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html>
- <https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html>

Entregável

- Fluxo recomendado de build (type-check + emit).
- Quando separar type-check de transpile.
- Como lidar com d.ts para consumo externo.
- Riscos de compatibilidade (target/module) em deploy.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Use apenas as fontes listadas.
- Marque desconhecidos claramente.
