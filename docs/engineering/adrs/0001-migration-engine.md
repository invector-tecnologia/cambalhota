# ADR 0001: Arquitetura do Migration Engine (Controle de Versões)

## Status
Aceito

## Data
2026-07-16

## Contexto
O projeto **Cambalhota** possui como um de seus épicos principais (Epic 2) a gestão de migrações estruturais de banco de dados. De acordo com nossa Constituição de Engenharia, devemos seguir as diretrizes obrigatórias:
- **DB-02:** Suporte obrigatório a PostgreSQL, MySQL e SQL Server.
- **ARQ-01:** Engine desenvolvida em Nim com foco em estabilidade e I/O.
- **ARQ-03:** O sistema de migrations (`up`/`down`) deve seguir os padrões de versão consolidados pelo Flyway e Liquibase.

Para atender à *Feature 2.3* (Execução segura com auditoria e controle de versão) e garantir a evolução determinística de banco de dados, precisamos estabelecer como o controle de versão será estruturado em disco, como a execução transacional vai ocorrer, e como será feita a auditoria das migrações.

## Decisão

Estabelecemos o seguinte design para o Migration Engine do Cambalhota:

### 1. Nomenclatura e Estrutura de Arquivos
Adotaremos uma convenção baseada em versão para os arquivos físicos de migração. Cada transição de esquema possuirá arquivos separados para evolução e reversão:
- **Up Migrations:** `V{Version}__{Description}.sql` (ex: `V1.0.1__Create_Users_Table.sql`)
- **Down Migrations (Rollbacks):** `U{Version}__{Description}.sql` (ex: `U1.0.1__Create_Users_Table.sql`)

A numeração das versões deve permitir versionamento semântico (ex: `1.0.1`, `202607161700`, etc.) e será ordenada alfanumericamente.

### 2. Tabela de Histórico (Audit Table)
O Cambalhota criará e manterá uma tabela reservada de controle no banco de dados alvo, chamada `cambalhota_schema_history` (similar ao `flyway_schema_history`). Esta tabela conterá as seguintes colunas obrigatórias:
- `installed_rank` (PK, ordem de instalação)
- `version` (string representativa da versão)
- `description` (nome/descrição da migração)
- `type` (SQL, Nim-script, etc.)
- `script` (nome do arquivo)
- `checksum` (hash do conteúdo do arquivo SQL)
- `installed_by` (usuário do banco)
- `installed_on` (timestamp de execução)
- `execution_time` (ms gastos)
- `success` (booleano de sucesso ou falha)

### 3. Mecanismo de Execução Seguro
1. **Locking:** Antes de iniciar o processo de migration, será adquirido um lock no banco de dados (ex: `pg_advisory_lock` no PostgreSQL ou uma tabela de lock no MySQL/SQL Server) para evitar condições de corrida (múltiplas instâncias do CLI executando migrations simultaneamente).
2. **Validação (Checksum):** As migrações já registradas no histórico serão lidas e seus checksums serão validados com os arquivos locais. Se um script modificado no disco divergir daquele executado no passado, o processo é interrompido.
3. **Execução:** As migrações não aplicadas (arquivos presentes no diretório, mas sem registro no banco) serão ordenadas e aplicadas sequencialmente. Sempre que possível no banco alvo (ex: PostgreSQL), as alterações DDL (Data Definition Language) de cada versão serão englobadas em transações (`BEGIN` e `COMMIT`) visando atomicidade.

### 4. Diffing e Geração Automática (Feature 2.2)
Para suportar as propostas automatizadas de migrations via comparação, o motor Nim extrairá metadados (`information_schema` e schemas específicos) de dois estados de banco. Ele detectará diffs de tabelas, índices e constraints para, então, auto-gerar o par `V` e `U` pronto para ser aprovado pelo desenvolvedor antes da execução final.

## Consequências

### Positivas
- **Previsibilidade:** Garante que toda transição de schema é rastreável, reproduzível e transacional.
- **Auditoria:** O controle fino na `cambalhota_schema_history` permite que operadores utilizem a TUI (Tatuí) para auditar detalhadamente quem instalou e quando instalou as migrations (Feature 2.3).
- **Padronização:** Como a lógica copia o design robusto do Flyway, a curva de adoção pelos desenvolvedores que já conhecem a ferramenta é reduzida a zero.

### Desafios / Pontos de Atenção
- Transações de DDL nem sempre são suportadas pelos SGBDs. O MySQL, por exemplo, faz commit implícito ao rodar comandos de DDL, limitando rollbacks automáticos e requerendo execução cautelosa.
- O mapeamento nativo em Nim que tratará os dialetos SQL de cada um dos três bancos (PostgreSQL, MySQL, SQL Server) demandará abstrações robustas de I/O e execução para funcionar corretamente.
