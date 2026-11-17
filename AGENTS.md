# AGENTS.md

## Language standard

- **US English** for all documentation (README, ADRs, runbooks, `.bene/`
  docs, AGENTS.md, skills), source code (identifiers, comments, log and
  error messages), commit messages, PR titles and bodies, and database,
  schema, table, column and procedure names. Follow market naming
  conventions, Clean Code and Clean Architecture.
- **Brazilian Portuguese** only for the conversation with the user and for
  end-user product content (UI copy, published texts).
- Private values in skills are **local only**: the skill keeps a `{{NAME}}`
  marker and the value exists only on the user's machine, in
  `~/.config/invector-skills/local-only.env`.
- Existing Portuguese docs, code and data names are being migrated by the
  `english-language-standard` program (`devops-invector/.bene/initiatives/`).
