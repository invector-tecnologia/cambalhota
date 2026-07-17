# Dossiê de Homologação de Qualidade - Épico 4 (Migration Engine)
**Status:** QA Aprovado ✅  
**Data:** 2026-07-17

## 1. Verificações de Base
- [x] O código fonte foi submetido a build com sucesso (`nimble build`).
- [x] A suíte de testes unitários foi processada e passou sem falhas (`nimble test tmigrations`).
- [x] Avaliada a existência e a robustez da validação de checksum (SHA-256) (implementação da função `applyMigration`).
- [x] O wrapper transacional `BEGIN/COMMIT` envolve corretamente a execução.

## 2. Cenários Gherkin

```gherkin
Feature: Validação de Integridade por Checksumming
  As an operational tool
  I want to ensure a migration file hasn't been altered after being installed
  So that I can guarantee structural consistency and prevent malicious or accidental corruption

  Scenario: Success on running untouched scripts (Happy Path)
    Given the migration "V20260717162000__create_users.up.sql" is already installed
    And its original checksum is recorded in the "cambalhota_schema_history"
    When the engine triggers a migration apply command
    And it calculates the local file checksum
    Then the calculated checksum must match the database checksum
    And the migration continues successfully or is skipped as already applied

  Scenario: Rejection of corrupted scripts (Error Path)
    Given the migration "V20260717162500__add_email_col.up.sql" was previously installed successfully
    But a developer manually modified the local .sql file to include a malicious DROP statement
    When the engine applies the migrations
    Then the engine computes the SHA-256 hash of the modified file
    And notices a mismatch against the "cambalhota_schema_history" table
    And aborts execution immediately throwing a "MigrationError"
    And preventing any database state modification

Feature: Mecanismos de Proteção Transacional
  As a database engineer
  I want script executions to be wrapped in transactions
  So that incomplete scripts rollback entirely if there is an error

  Scenario: Auto-wrapping of DDL commands
    Given the migration script contains a syntax error
    When the engine prepares the script for execution
    Then it must prepend "BEGIN;" and append "COMMIT;" to the execution buffer
    And the database driver must automatically trigger a ROLLBACK upon the syntax error
    And the state of the database remains completely unchanged
```

## 3. Relatório da Intervenção QA
Durante o processo de Quality Assurance (QA), foi constatado que, apesar da lógica atômica estar presente em `src/core/migrations.nim`, faltava a **orquestração efetiva da validação** (o comparativo do hash na base contra o script rodado) e a função não estava conectada ao CLI TUI (`main.nim`).

A equipe de QA interviu diretamente garantindo:
1. Inserção de `applyMigration` com o fluxo de falha (Throw CatchableError) quando houver diferença de hash (`getInstalledChecksum` vs arquivo físico).
2. Substituição no Controller (`src/main.nim`) apontando para o `applyMigration` utilizando o path real e conectando a restrição estrutural.

O processo agora é Fail-Safe, confirmando a entrega das features 4.1, 4.3 e 4.4.
