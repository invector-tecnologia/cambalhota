# Prompts para Contexto de LLM

Objetivo: Fornecer contexto rico e preciso para que qualquer LLM entenda como cada stack é aplicada neste sistema.

Guia de tom

- Aquisição de contexto: analítico, cauteloso, baseado em evidência.
- Passos de ação: diretivo, conciso, numerado e testável.

Uso

- Escolha um ou mais arquivos abaixo e cole no seu LLM.
- Substitua placeholders como <...> por valores reais quando existirem.
- Mantenha referências a arquivos precisas e concisas.

Bootstrap automático de nova stack

- Para criar um set padrão 01-11 automaticamente: `npm run prompts:bootstrap-stack -- <NOME_DA_STACK>`
- Exemplo de uso: `npm run prompts:bootstrap-stack -- XPTO`
- O script cria somente arquivos ausentes e não sobrescreve os existentes.
- Depois de gerar, atualize este README para incluir a nova stack.

Prompt set

- 00-context-acquisition.md
- 01-tone-guidelines.md

Prompt set AdonisJS

- AdonisJS/01-system-overview.md
- AdonisJS/02-architecture.md
- AdonisJS/03-data-model.md
- AdonisJS/04-runtime-config.md
- AdonisJS/05-observability.md
- AdonisJS/06-routing-and-http.md
- AdonisJS/07-fiscal-module.md
- AdonisJS/08-tests-and-quality.md
- AdonisJS/09-deployment.md
- AdonisJS/10-performance-diagnostics.md

Prompt set TypeScript

- TypeScript/01-system-overview.md
- TypeScript/02-architecture.md
- TypeScript/03-data-model.md
- TypeScript/04-runtime-config.md
- TypeScript/05-observability.md
- TypeScript/06-routing-and-http.md
- TypeScript/07-domain-module.md
- TypeScript/08-tests-and-quality.md
- TypeScript/09-deployment.md
- TypeScript/10-performance-diagnostics.md

Prompt set Heroku

- Heroku/01-system-overview.md
- Heroku/02-architecture.md
- Heroku/03-data-model.md
- Heroku/04-runtime-config.md
- Heroku/05-observability.md
- Heroku/06-routing-and-http.md
- Heroku/07-domain-module.md
- Heroku/08-tests-and-quality.md
- Heroku/09-deployment.md
- Heroku/10-performance-db.md
- Heroku/11-performance-diagnostics.md

Prompt set SEFAZ

- SEFAZ/01-system-overview.md
- SEFAZ/02-architecture.md
- SEFAZ/03-data-model.md
- SEFAZ/04-runtime-config.md
- SEFAZ/05-observability.md
- SEFAZ/06-routing-and-http.md
- SEFAZ/07-domain-module.md
- SEFAZ/08-tests-and-quality.md
- SEFAZ/09-deployment.md
- SEFAZ/10-performance-db.md
- SEFAZ/11-performance-diagnostics.md

Prompt set Cloudflare

- Cloudflare/01-system-overview.md
- Cloudflare/02-architecture.md
- Cloudflare/03-data-model.md
- Cloudflare/04-runtime-config.md
- Cloudflare/05-observability.md
- Cloudflare/06-routing-and-http.md
- Cloudflare/07-domain-module.md
- Cloudflare/08-tests-and-quality.md
- Cloudflare/09-deployment.md
- Cloudflare/10-performance-db.md
- Cloudflare/11-performance-diagnostics.md

Prompt set FISCAL

- FISCAL/01-system-overview.md
- FISCAL/02-architecture.md
- FISCAL/03-data-model.md
- FISCAL/04-runtime-config.md
- FISCAL/05-observability.md
- FISCAL/06-routing-and-http.md
- FISCAL/07-domain-module.md
- FISCAL/08-tests-and-quality.md
- FISCAL/09-deployment.md
- FISCAL/10-performance-db.md
- FISCAL/11-performance-diagnostics.md

Prompt set OPERACAO

- OPERACAO/01-system-overview.md
- OPERACAO/02-architecture.md
- OPERACAO/03-data-model.md
- OPERACAO/04-runtime-config.md
- OPERACAO/05-observability.md
- OPERACAO/06-routing-and-http.md
- OPERACAO/07-domain-module.md
- OPERACAO/08-tests-and-quality.md
- OPERACAO/09-deployment.md
- OPERACAO/10-performance-db.md
- OPERACAO/11-performance-diagnostics.md

Prompt set ESTOQUE

- ESTOQUE/01-system-overview.md
- ESTOQUE/02-architecture.md
- ESTOQUE/03-data-model.md
- ESTOQUE/04-runtime-config.md
- ESTOQUE/05-observability.md
- ESTOQUE/06-routing-and-http.md
- ESTOQUE/07-domain-module.md
- ESTOQUE/08-tests-and-quality.md
- ESTOQUE/09-deployment.md
- ESTOQUE/10-performance-db.md
- ESTOQUE/11-performance-diagnostics.md

Prompt set FINANCEIRO

- FINANCEIRO/01-system-overview.md
- FINANCEIRO/02-architecture.md
- FINANCEIRO/03-data-model.md
- FINANCEIRO/04-runtime-config.md
- FINANCEIRO/05-observability.md
- FINANCEIRO/06-routing-and-http.md
- FINANCEIRO/07-domain-module.md
- FINANCEIRO/08-tests-and-quality.md
- FINANCEIRO/09-deployment.md
- FINANCEIRO/10-performance-db.md
- FINANCEIRO/11-performance-diagnostics.md

Prompt set IMPRESSAO

- IMPRESSAO/01-system-overview.md
- IMPRESSAO/02-architecture.md
- IMPRESSAO/03-data-model.md
- IMPRESSAO/04-runtime-config.md
- IMPRESSAO/05-observability.md
- IMPRESSAO/06-routing-and-http.md
- IMPRESSAO/07-domain-module.md
- IMPRESSAO/08-tests-and-quality.md
- IMPRESSAO/09-deployment.md
- IMPRESSAO/10-performance-db.md
- IMPRESSAO/11-performance-diagnostics.md

Prompt set REPROCESSAMENTO

- REPROCESSAMENTO/01-system-overview.md
- REPROCESSAMENTO/02-architecture.md
- REPROCESSAMENTO/03-data-model.md
- REPROCESSAMENTO/04-runtime-config.md
- REPROCESSAMENTO/05-observability.md
- REPROCESSAMENTO/06-routing-and-http.md
- REPROCESSAMENTO/07-domain-module.md
- REPROCESSAMENTO/08-tests-and-quality.md
- REPROCESSAMENTO/09-deployment.md
- REPROCESSAMENTO/10-performance-db.md
- REPROCESSAMENTO/11-performance-diagnostics.md

Prompt set ADMIN

- ADMIN/01-system-overview.md
- ADMIN/02-architecture.md
- ADMIN/03-data-model.md
- ADMIN/04-runtime-config.md
- ADMIN/05-observability.md
- ADMIN/06-routing-and-http.md
- ADMIN/07-domain-module.md
- ADMIN/08-tests-and-quality.md
- ADMIN/09-deployment.md
- ADMIN/10-performance-db.md
- ADMIN/11-performance-diagnostics.md

Prompt set SUPORTE

- SUPORTE/01-system-overview.md
- SUPORTE/02-architecture.md
- SUPORTE/03-data-model.md
- SUPORTE/04-runtime-config.md
- SUPORTE/05-observability.md
- SUPORTE/06-routing-and-http.md
- SUPORTE/07-domain-module.md
- SUPORTE/08-tests-and-quality.md
- SUPORTE/09-deployment.md
- SUPORTE/10-performance-db.md
- SUPORTE/11-performance-diagnostics.md

Prompt set TRANSVERSAL

- TRANSVERSAL/01-system-overview.md
- TRANSVERSAL/02-architecture.md
- TRANSVERSAL/03-data-model.md
- TRANSVERSAL/04-runtime-config.md
- TRANSVERSAL/05-observability.md
- TRANSVERSAL/06-routing-and-http.md
- TRANSVERSAL/07-domain-module.md
- TRANSVERSAL/08-tests-and-quality.md
- TRANSVERSAL/09-deployment.md
- TRANSVERSAL/10-performance-db.md
- TRANSVERSAL/11-performance-diagnostics.md

Prompt set VOICE_ORDERING

- VOICE_ORDERING/01-system-overview.md
- VOICE_ORDERING/02-architecture.md
- VOICE_ORDERING/03-data-model.md
- VOICE_ORDERING/04-runtime-config.md
- VOICE_ORDERING/05-observability.md
- VOICE_ORDERING/06-routing-and-http.md
- VOICE_ORDERING/07-domain-module.md
- VOICE_ORDERING/08-tests-and-quality.md
- VOICE_ORDERING/09-deployment.md
- VOICE_ORDERING/10-performance-db.md
- VOICE_ORDERING/11-performance-diagnostics.md

Arquivos legados FISCAL (referência histórica)

- FISCAL/FISCAL_EMISSION_FIX_CONTEXT.md
- FISCAL/SOAP_NFE_400_FIX.md

Notas

- Prefira fatos ancorados em arquivos.
- Evite especulação; marque desconhecidos claramente.
- Use o guia de tom acima.
- Ao adicionar novos prompts, sempre atualize esta lista e revise prompts impactados.
- Ao criar uma nova pasta de stack, espelhe esta estrutura e liste aqui.
- O prompt 01-tone-guidelines.md deve permanecer na raiz para uso compartilhado.
- Ao alterar Markdown de docs/prompts, execute `npx -y markdownlint-cli2 "docs/**/*.md" "*.md"` e corrija os erros antes de concluir.
