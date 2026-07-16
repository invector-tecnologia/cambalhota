# Mapa Arquitetural — Cambalhota

## Visão Geral

O **Cambalhota** é uma aplicação CLI/TUI nativa compilada em **Nim**, cujo objetivo é interagir diretamente com bancos de dados relacionais e CDNs para backup e controle de versão estrutural (Migrations).

## Componentes

1. **Camada de UI (Tatuí Frontend)**
   - Gerencia a renderização no terminal (dark-mode, abas de navegação).
   - Abas principais: Extrator, Gestor de Migrations, Central de Restauração.
2. **Camada de Domínio (Nim Core)**
   - Engine de Diffs: Compara schemas para gerar migrações.
   - Extrator (Dump Engine): Realiza backups completos e padronizados.
   - Restore Engine: Interpreta os scripts SQL e reverte ou injeta dados no banco alvo.
3. **Integração de Persistência**
   - CDN/Git Connector: Realiza o offload dos arquivos extraídos para armazenamento seguro.
