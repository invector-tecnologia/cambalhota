---
name: qa-gherkin
description: >
  Generates test plans in Gherkin format (.feature) in Portuguese for the tavolo project.
  Activate when the qa agent needs to create test scenarios, validate implementations
  or generate exploratory test plans.
---

# QA Gherkin

## Overview

This skill generates test plans in Gherkin format (`.feature`) written in Portuguese (pt-BR) for the tavolo project. The plans cover happy path scenarios, edge cases, error scenarios, multi-tenant isolation and role-based access control. Each test plan is linked to an accepted ADR and serves as an executable specification for validating the implementation.

## When to Use

- After an ADR is accepted and the corresponding code is implemented (or being implemented).
- When validating that a feature meets the defined acceptance criteria.
- When generating exploratory test plans for existing features.
- When verifying data isolation between tenants.
- When validating that the permission hierarchy is applied correctly.
- When documenting regressions identified during code review.

## Language

All `.feature` files must start with the language header:

```gherkin
# language: pt
```

This ensures Gherkin parsers interpret the keywords in Portuguese:
- `Funcionalidade` (Feature)
- `Contexto` (Background)
- `Cenário` (Scenario)
- `Esquema do Cenário` (Scenario Outline)
- `Exemplos` (Examples)
- `Dado` / `Dados` (Given)
- `Quando` (When)
- `Então` (Then)
- `E` (And)
- `Mas` (But)

## Coverage Requirements

Every test plan must include, at a minimum:

| Scenario Type | Minimum Quantity | Description |
|-----------------|-------------------|-----------|
| Happy path | 1 | Main flow with valid data |
| Edge cases | 2 | Limits, extreme values, atypical inputs |
| Error scenario | 1 | Invalid inputs, expected failures, error messages |
| Multi-tenant isolation | 1 | Verification that one tenant's data does not leak to another |

Additional recommended scenarios (not mandatory):
- Concurrency scenarios (simultaneous operations on the same resource).
- Idempotency scenarios (repeating the same operation).
- Performance scenarios (response time limits).

## .feature File Template

```gherkin
# language: pt

Funcionalidade: Título descritivo da funcionalidade
  Como um <role>
  Eu quero <ação>
  Para que <benefício>

  Contexto:
    Dado que o sistema está operacional
    E que existe um tenant "Clínica Exemplo" cadastrado

  # --- Caminho Feliz ---

  Cenário: Descrição do cenário de sucesso
    Dado que o usuário "<role>" está autenticado no tenant "Clínica Exemplo"
    E que <pré-condição>
    Quando <ação do usuário>
    Então <resultado esperado>
    E <verificação adicional>

  # --- Casos de Borda ---

  Cenário: Descrição do caso de borda 1
    Dado que <contexto do caso de borda>
    Quando <ação>
    Então <resultado esperado>

  Cenário: Descrição do caso de borda 2
    Dado que <contexto do caso de borda>
    Quando <ação>
    Então <resultado esperado>

  # --- Cenário de Erro ---

  Cenário: Descrição do cenário de erro
    Dado que <contexto>
    Quando <ação inválida>
    Então o sistema deve retornar um erro
    E a mensagem deve indicar o motivo da falha

  # --- Isolamento Multi-Tenant ---

  Cenário: Dados de um tenant não são visíveis para outro tenant
    Dado que existe um tenant "Clínica A" com dados cadastrados
    E que existe um tenant "Clínica B" com dados cadastrados
    Quando o usuário do tenant "Clínica B" consulta os dados
    Então os dados do tenant "Clínica A" não devem ser retornados
    E apenas os dados do tenant "Clínica B" devem ser visíveis
```

## Naming Convention

`.feature` files must follow the pattern:

```
NNN_nome_do_adr.feature
```

- **NNN**: number of the ADR that originated the feature.
- **nome_do_adr**: same name used in the corresponding ADR, in snake_case, without accents.

### Examples

| ADR | .feature file |
|-----|-----------------|
| `001_autenticacao_jwt.md` | `001_autenticacao_jwt.feature` |
| `002_estrategia_multi_tenant.md` | `002_estrategia_multi_tenant.feature` |
| `003_migracao_banco_dados.md` | `003_migracao_banco_dados.feature` |

## Location

All test plans must be stored in:

```
docs/engineering/qa_plans/
```

Do not create subdirectories inside this folder. All `.feature` files live at the same level.

## Semantic Validation

Prefer contextual assertions over exact text matching. This makes tests more resilient to UI changes and internationalization.

### ❌ Avoid — exact matching

```gherkin
Então a mensagem exibida deve ser "Animal cadastrado com sucesso!"
```

### ✅ Prefer — contextual assertion

```gherkin
Então o sistema deve confirmar o cadastro do animal
E o animal deve constar na lista de animais do tenant
```

### Guidelines

- Use assertions that validate **behavior** and **state**, not literal texts.
- Check **side effects** (database records, emitted events) when relevant.
- Validate **absence of data** in multi-tenant isolation scenarios (e.g.: "não devem ser retornados").
- Validate **HTTP status codes** in API scenarios when applicable (e.g.: "o sistema deve retornar status 403").

## Role-Based Scenarios

Each test plan must consider the tavolo role hierarchy and include scenarios that validate access control. The hierarchy is:

```
superadmin > admin > coordenador > voluntário > tavoloário > visualização
```

### Scenario types per role

| Role | Typical scenarios |
|------|-----------------|
| **superadmin** | Full access, tenant management, cross-tenant operations |
| **admin** | Management of tenant users and settings |
| **coordenador** | Coordination of volunteers and scheduling |
| **voluntário** | Activity logging, animal follow-up |
| **tavoloário** | Medical records, prescriptions, clinical procedures |
| **visualização** | Read-only, no write permission |

### Template for a permission scenario

```gherkin
  Esquema do Cenário: Acesso à funcionalidade por role
    Dado que o usuário com role "<role>" está autenticado
    Quando o usuário tenta <ação>
    Então o sistema deve <resultado>

    Exemplos:
      | role          | resultado                          |
      | superadmin    | permitir a operação                |
      | admin         | permitir a operação                |
      | coordenador   | permitir a operação                |
      | voluntário    | negar a operação com status 403    |
      | tavoloário   | negar a operação com status 403    |
      | visualização  | negar a operação com status 403    |
```

## Full Example — Animal Registration

```gherkin
# language: pt

Funcionalidade: Cadastro de animal
  Como um coordenador
  Eu quero cadastrar um novo animal no sistema
  Para que ele possa receber acompanhamento tavoloário

  Contexto:
    Dado que o sistema está operacional
    E que existe um tenant "Clínica Esperança" cadastrado
    E que o schema do banco de dados está configurado via DATABASE_SCHEMA

  # --- Caminho Feliz ---

  Cenário: Cadastrar animal com dados válidos
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    E que os seguintes dados do animal são fornecidos:
      | campo     | valor         |
      | nome      | Rex           |
      | especie   | Canino        |
      | raca      | SRD           |
      | idade     | 3 anos        |
      | peso      | 12.5 kg       |
    Quando o usuário envia a solicitação de cadastro
    Então o sistema deve confirmar o cadastro do animal
    E o animal "Rex" deve constar na lista de animais do tenant "Clínica Esperança"
    E o registro deve conter a data de cadastro atual

  # --- Casos de Borda ---

  Cenário: Cadastrar animal com nome no limite máximo de caracteres
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário cadastra um animal com nome de 255 caracteres
    Então o sistema deve aceitar o cadastro normalmente

  Cenário: Cadastrar animal com peso zero
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário cadastra um animal com peso "0"
    Então o sistema deve rejeitar o cadastro
    E deve indicar que o peso deve ser maior que zero

  # --- Cenário de Erro ---

  Cenário: Cadastrar animal sem campos obrigatórios
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário envia a solicitação de cadastro sem o campo "nome"
    Então o sistema deve retornar um erro de validação
    E deve indicar que o campo "nome" é obrigatório

  # --- Isolamento Multi-Tenant ---

  Cenário: Animais de um tenant não são visíveis para outro tenant
    Dado que o tenant "Clínica Esperança" possui o animal "Rex" cadastrado
    E que o tenant "Pet Saúde" possui o animal "Luna" cadastrado
    Quando o usuário "coordenador" do tenant "Pet Saúde" lista os animais
    Então o animal "Rex" do tenant "Clínica Esperança" não deve ser retornado
    E apenas o animal "Luna" deve ser visível

  # --- Controle de Acesso por Role ---

  Esquema do Cenário: Permissão de cadastro de animal por role
    Dado que o usuário com role "<role>" está autenticado no tenant "Clínica Esperança"
    Quando o usuário tenta cadastrar um novo animal
    Então o sistema deve <resultado>

    Exemplos:
      | role          | resultado                          |
      | superadmin    | permitir o cadastro                |
      | admin         | permitir o cadastro                |
      | coordenador   | permitir o cadastro                |
      | voluntário    | permitir o cadastro                |
      | tavoloário   | permitir o cadastro                |
      | visualização  | negar o cadastro com status 403    |

  Cenário: Usuário com role visualização não pode editar animal
    Dado que o usuário com role "visualização" está autenticado no tenant "Clínica Esperança"
    E que o animal "Rex" está cadastrado
    Quando o usuário tenta editar os dados do animal "Rex"
    Então o sistema deve negar a operação
    E deve retornar status 403
```
