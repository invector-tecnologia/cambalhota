# Prompt de Início

## Prompt de Auto-Contextualização e Ação

Agora vamos avançar.
Siga os prompts `docs/prompt-migration/00-context-acquisition.md` e `docs/prompt-migration/01-tone-guidelines.md` e adquira o conhecimento da documentação de cada stack alvo. Quando identificar stack fora do padrão, crie/normalize os prompts em `docs/prompt-migration/<STACK>`. Use o `docs/prompt-migration/README.md` como índice oficial das stacks disponíveis e do padrão esperado. Como método, tome decisões sem perguntar, a não ser que haja risco alto.

Para criar rapidamente o skeleton padrão de uma nova stack, use:

- `npm run prompts:bootstrap-stack -- <STACK>`

Stacks funcionais ativas (já padronizadas):

- `docs/prompt-migration/OPERACAO`
- `docs/prompt-migration/ESTOQUE`
- `docs/prompt-migration/FINANCEIRO`
- `docs/prompt-migration/IMPRESSAO`
- `docs/prompt-migration/REPROCESSAMENTO`
- `docs/prompt-migration/ADMIN`
- `docs/prompt-migration/SUPORTE`
- `docs/prompt-migration/TRANSVERSAL`
- `docs/prompt-migration/VOICE_ORDERING`

Lembre-se de atualizar a documentação e os prompts conforme necessário, para garantir que o conhecimento adquirido seja compartilhado e acessível para toda a equipe.
Ao alterar arquivos Markdown, rode `npx -y markdownlint-cli2 "docs/**/*.md" "*.md"` e corrija os problemas antes de finalizar.

## Prompt de Ação de Engenharia de Software

Agora vamos avançar.
Siga os prompts contidos em `docs/prompt-migration/AdonisJS`, `docs/prompt-migration/Cloudflare`, `docs/prompt-migration/Heroku`, `docs/prompt-migration/SEFAZ`, `docs/prompt-migration/TypeScript`, `docs/prompt-migration/FISCAL`, nas stacks funcionais (`OPERACAO`, `ESTOQUE`, `FINANCEIRO`, `IMPRESSAO`, `REPROCESSAMENTO`, `ADMIN`, `SUPORTE`, `TRANSVERSAL`, `VOICE_ORDERING`) e nos documentos presentes na raiz `docs/` para adquirir o conhecimento da documentação técnica do projeto. Como método, tome decisões sem perguntar, a não ser que haja risco alto.

Então, execute a tarefa de engenharia solicitada.

Lembre-se de atualizar a documentação e os prompts conforme necessário, para garantir que o conhecimento adquirido seja compartilhado e acessível para toda a equipe.
Ao alterar arquivos Markdown, rode `npx -y markdownlint-cli2 "docs/**/*.md" "*.md"` e corrija os problemas antes de finalizar.
Rode o `npm run build` para capturar possíveis erros e corrigi-los antes de publicar no Heroku.
