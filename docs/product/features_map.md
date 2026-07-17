# Mapa de Funcionalidades (Features Map) - Cambalhota

Este documento detalha todos os Épicos e Features do produto Cambalhota, atuando como um mapa rastreável a partir do Escopo Estratégico (PRD) e das decisões arquiteturais tomadas pela engenharia.

## Epic 1: Configuração do Sistema e Conexão
- **Feature 1.1: Gerenciamento de Conexões** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Configuração segura de credenciais via URL de conexão com suporte multi-engine agnóstico (PostgreSQL, Oracle, MSSQL, MySQL, SQLite, SPANNER, INDEDB, VECTORDB, BigQuery, CouchDB, MongoDB, etc).
  - Bloqueio contra armazenamento de credenciais em texto pleno no código-fonte.
  - Identificação e listagem dinâmica dos schemas disponíveis no banco para seleção.
- **Feature 1.2: Integração de Repositório/CDN** `[A Fazer]` `(v2.0)`
  - Vinculação de uma "CDN" ou Repositório Git (S3, GCP Buckets, Cloudflare R2, Google Drive, Dropbox, OneDrive, ou NAS) para atuar como central de espelhamento e upload em nuvem.
- **Feature 1.3: Preferências de Projeto** `[A Fazer]` `(v1.0)`
  - Configuração sobre o formato da geração e exportação de arquivos, como as migrations (Plain text ou SQL puro).

## Epic 2: Extração (Backup) e Persistência
- **Feature 2.1: Extração Estruturada** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Processamento e dump unificado de metadados e dados utilizando de forma agnóstica as CLIs padrão de cada engine suportada (ex: pg_dump para PostgreSQL, expdp para Oracle, sqlcmd/bcp para MSSQL, mysqldump para MySQL, sqlite3 para SQLite, bq extract para BigQuery, mongodump para MongoDB, gcloud spanner para SPANNER, etc).
  - Padronização automatizada da nomenclatura de artefatos de saída (ex: `yyyy-mm-dd_HhMM_schema_dump-db.sql`).
- **Feature 2.2: Persistência Remota** `[A Fazer]` `(v2.0)`
  - Upload automático dos dumps e artefatos extraídos para a CDN ou Repositório Git configurado no Epic 1, garantindo redundância em nuvem dos backups.

## Epic 3: Restauração (Restore)
- **Feature 3.1: Listagem e Histórico Local** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Leitura e exibição visual de todos os arquivos e versões de backup criptografados existentes no diretório local `~/.cambalhota/db_dumps/YYYY/`.
- **Feature 3.2: Restore Integral** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Restauração de ponta-a-ponta (esquemas estruturais, tabelas e seus dados) no banco de dados a partir de um backup específico escolhido pelo usuário no terminal.

## Epic 4: Migration Engine (Controle de Versão Estrutural)
- **Feature 4.1: Sistema de Migrations Flyway-like** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Geração de arquivos físicos com scripts de transição (`up` / `V...__desc.sql`) e reversão (`down` / `U...__desc.sql`), seguindo um versionamento semântico ou baseado em timestamp.
- **Feature 4.2: Diffing Estrutural** `[A Fazer]` `(v2.0)`
  - Comparação autônoma de metadados entre dois estados diferentes do banco de dados (tabelas, índices, constraints).
  - Auto-geração e proposição de scripts de migration preenchendo as diferenças detectadas antes da execução.
- **Feature 4.3: Execução Transacional e Proteção contra Concorrência** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Mecanismo de Locking (ex: `pg_advisory_lock`) bloqueando execuções conflitantes de outras instâncias simultâneas.
  - Englobamento de execuções DDL em bloco transacional onde os SGBDs suportarem (`BEGIN`/`COMMIT`).
- **Feature 4.4: Auditoria de Integridade e Histórico** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Manutenção e rastreio via tabela reservada `cambalhota_schema_history`.
  - Validação de checksum dos scripts físicos contra as execuções anteriores registradas, impedindo manipulações posteriores perigosas.
  - Registro pormenorizado do tempo, autoria e sucesso da instalação na tabela de auditoria e exposição nos relatórios.

## Epic 5: Interface de Usuário no Terminal (TUI)
- **Feature 5.1: Experiência TUI Padronizada** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Navegação visual através de abas e painéis implementada sobre a tecnologia base (Tatuí).
  - Padronização orientada ao Design System: Dark mode, tipografia `Monoid`, layout fluido com bordas arredondadas e destaques por cores lógicas (sucesso, alerta, informação).
  - Exibição de painéis ricos para as saídas de relatórios de migration, auditorias e listagens locais de restore.

## Epic 6: Documentação e Utilitários Técnicos
- **Feature 6.1: Documentação DDL Automática** `[A Fazer]` `(v2.0)`
  - Autogeração do Dicionário de Dados do esquema estrutural no formato Markdown voltado à engenharia.
- **Feature 6.2: Mock e Teste** `[A Fazer]` `(v2.0)`
  - Extração focada de DDL/DML para ambientes de testes locais (fixtures e seeders).
- **Feature 6.3: Visualização Arquitetural** `[A Fazer]` `(v2.0)`
  - Geração de representações gráficas exportáveis demonstrando o relacionamento visual e relacional do esquema extraído.

## Epic 7: Segurança e Otimização de Payload
- **Feature 7.1: Criptografia de Disco Padrão** `[Concluído] [QA Aprovado]` `(v1.0)`
  - Criptografia dos artefatos de backup por padrão (ex: AES-256) persistidos no diretório local `~/.cambalhota/db_dumps/YYYY/`, garantindo segurança at-rest na máquina host.
- **Feature 7.2: Compressão de Streams** `[Concluído] [QA Aprovado]` `(v2.0)`
  - Compressão on-the-fly (ex: GZIP ou ZSTD) para envio futuro à CDN, reduzindo consumo de banda e custos de storage.
