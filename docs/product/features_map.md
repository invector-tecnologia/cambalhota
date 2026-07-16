# Mapa de Funcionalidades — Cambalhota

Este documento rastreia os épicos e features descritas no `scope.md`.

## Epics

### Epic 1: Backup e Restauração em Nuvem
- **Feature 1.1:** Extração completa (schema e dados).
- **Feature 1.2:** Envio automático para repositórios CDN/Git configurados.
- **Feature 1.3:** Restauração (restore) direta a partir de listagens remotas no TUI.

### Epic 2: Gestão de Migrações (Benchmark: Flyway)
- **Feature 2.1:** Geração de migrações (`up`/`down`) de modo automatizado e manual.
- **Feature 2.2:** Detecção de diffs estruturais entre dois schemas para sugerir migrations.
- **Feature 2.3:** Execução segura de migrations com auditoria de sucesso/falha e controle de versão de schema.

### Epic 3: Documentação Técnica
- **Feature 3.1:** Geração de Dicionário de Dados em Markdown e scripts de mock DDL/DML para testes.
