# Constituição de Engenharia — Cambalhota

> **Contrato inviolável.** Este documento é a lei suprema de engenharia do projeto Cambalhota. Todo agente, desenvolvedor ou pipeline de CI/CD **DEVE** obedecer às regras aqui listadas.

## 1. Regras de Banco de Dados e Armazenamento

| # | Regra | Nível |
|---|-------|-------|
| DB-01 | ⛔ Credenciais de banco e CDN **NUNCA** devem existir no código-fonte em texto plano. | ⛔ Forbidden |
| DB-02 | ✅ Suporte obrigatório a Múltiplos Motores Relacionais: PostgreSQL, MySQL e SQL Server. | ✅ Obrigatório |
| DB-03 | ✅ Todo dump extraído deve ser persistido remotamente (CDN ou Git) e listado de forma auditável. | ✅ Obrigatório |

## 2. Regras de Arquitetura e Código

| # | Regra | Nível |
|---|-------|-------|
| ARQ-01 | ✅ O Backend/CLI DEVE ser escrito em **Nim** com priorização de estabilidade e I/O rápido. | ✅ Obrigatório |
| ARQ-02 | ✅ O Frontend DEVE ser uma interface TUI (Terminal User Interface) baseada no framework **Tatuí**. | ✅ Obrigatório |
| ARQ-03 | ✅ Migrations (Up/Down) devem seguir os padrões de versão comparáveis ao Flyway e Liquibase. | ✅ Obrigatório |
