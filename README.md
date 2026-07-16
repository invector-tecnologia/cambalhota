# Cambalhota

Uma ferramenta robusta baseada em TUI (Terminal User Interface) desenvolvida em **Nim** e **Tatuí** para gerenciamento completo de bancos de dados relacionais.

## Funcionalidades Core
- **Backup e Restauração Avançados:** Extraia metadados e dados (PostgreSQL, MySQL, SQL Server) com facilidade. Realize a restauração (restore) completa do schema, tabelas e dados.
- **Persistência em Git/CDN:** Arquivos de dump não ficam soltos! Exige e integra-se diretamente a provedores de armazenamento em nuvem (S3, GCP, R2, GDrive, Dropbox, OneDrive) ou repositórios Git para a persistência das extrações.
- **Gerenciamento de Migrações (Benchmark: Flyway/Liquibase):** Gera, compara (diffs estruturais), audita e executa sequências de migrações estruturais (`up/down`) de forma robusta e confiável.
- **Documentação Técnica:** Gera documentação técnica automaticamente em Markdown a partir do schema extraído.

## Primeiros Passos
O projeto foi instrumentado com a arquitetura de múltiplos agentes **Antigravity**. Para inicializar o ecossistema e o *scaffolding* estrutural do projeto, execute o script de `harness` via CLI do Antigravity:

```bash
ag runbook execute -f harness_instruction.yaml
```
Isso irá construir toda a base de repositórios, injetar as skills corretas (`nim-cli-backend`, `tatui-frontend`, `migration-engine`) e preparar o sistema para o desenvolvimento focado no novo escopo.
