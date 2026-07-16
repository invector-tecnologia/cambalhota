# System Prompt - Agentes Cambalhota

## Stack Tecnológica

- **Backend / Core Engine:** Nim (Compilação ORC para alta performance, I/O intensivo)
- **Frontend / CLI:** Tatuí (Terminal User Interface framework)
- **Infra / Ferramentas:** Shell/Bash scripting
- **Persistência Externa:** Git, CDNs diversas (AWS S3, GCP, Cloudflare R2, Dropbox, GDrive)

## Regras Core de Negócios

- **Dump & Restore:** O sistema deve interagir de forma robusta e segura com SGBDs relacionais (PostgreSQL, MySQL, SQL Server) para extração integral de metadados e dados. 
- **Offload de Backups:** Arquivos .sql gerados **NUNCA** devem residir soltos na infraestrutura após a operação; obrigatoriamente devem ser disparados para o repósitório Git ou CDN homologados.
- **Gerenciamento Flyway-Like:** A engenharia de migrações (`up`/`down`) será tratada com um framework comparável ao Flyway/Liquibase, mantendo um controle de versões e diffs estruturais severo.

## Segurança

- **Zero-Trust para Credenciais:** Proibido estritamente deixar qualquer variável de acesso a DB ou chaves de CDNs vazarem para arquivos persistidos em repositório (ex: hardcoded ou arquivos `.env` commitados).
- Utilizar apenas a leitura segura por hooks de segurança ou injeção de variáveis de ambiente.

## Convenções de Código

- Arquitetura focada na agilidade do terminal, separando responsabilidades: `CLI/TUI (Apresentação) → Migration Engine → Extractor Engine`.
- Documentações devem ser automaticamente geradas em formato Markdown padrão.

## Modelo de Aprovação

1. Para cada tarefa, **sugerir** o modelo Gemini mais adequado (Flash, Pro, etc.) com justificativa.
2. **Aguardar aprovação explícita** do usuário antes de iniciar grandes implementações em `src/`.
3. Apresentar um resumo dos comandos antes de qualquer alteração destrutiva ou remoção de pastas.

## Referências

- [Constituição do Projeto](../docs/engineering/constitution.md)
- [Escopo do Produto](../docs/scope.md)
- [Mapa de Funcionalidades](../docs/product/features_map.md)

## Agentes Operacionais

- [Agente Arquitetura](../.agents/arch/agent.md) — Design do engine Nim e integrações TUI
- [Agente Engenharia](../.agents/eng/agent.md) — Implementação das lógicas core de migrations e dumps
- [Agente Produto](../.agents/prod/agent.md) — Escopo e features_map
- [Agente QA](../.agents/qa/agent.md) — Casos de uso de extração, falhas em restore e monitoramento
