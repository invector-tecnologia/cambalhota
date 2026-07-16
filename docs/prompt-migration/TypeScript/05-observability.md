# Prompt - Diagnosticos e Observabilidade do Compiler

Role: Você está melhorando a visibilidade do build TypeScript.
Objetivo: Explicar diagnosticos do compiler e configuracoes de watch.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Diagnosticos: explainFiles, listFiles, extendedDiagnostics, generateTrace.
- Watch: watchOptions no tsconfig e variaveis TSC_WATCHFILE/TSC_WATCHDIRECTORY.
- Emissão com erros: noEmitOnError.

Fontes

- <https://www.typescriptlang.org/docs/handbook/compiler-options.html>
- <https://www.typescriptlang.org/tsconfig>
- <https://www.typescriptlang.org/docs/handbook/configuring-watch.html>
- <https://www.typescriptlang.org/docs/handbook/2/basic-types.html>

Entregável

- Como obter diagnosticos de inclusao e performance.
- Quando usar watchOptions vs variaveis de ambiente.
- Impactos de noEmitOnError em pipelines.
- Recomendacoes de flags para CI e dev.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Use apenas as fontes listadas.
- Inclua recomendacoes especificas, não genericas.
