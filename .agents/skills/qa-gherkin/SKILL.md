---
name: qa-gherkin
description: >
  Generates test plans in Gherkin format (.feature) in US English for the tavolo project.
  Activate when the qa agent needs to create test scenarios, validate implementations
  or generate exploratory test plans.
---

# QA Gherkin

## Overview

This skill generates test plans in Gherkin format (`.feature`) written in US English (English keywords and step text) for the tavolo project. The plans cover happy path scenarios, edge cases, error scenarios, multi-tenant isolation and role-based access control. Each test plan is linked to an accepted ADR and serves as an executable specification for validating the implementation.

## When to Use

- After an ADR is accepted and the corresponding code is implemented (or being implemented).
- When validating that a feature meets the defined acceptance criteria.
- When generating exploratory test plans for existing features.
- When verifying data isolation between tenants.
- When validating that the permission hierarchy is applied correctly.
- When documenting regressions identified during code review.

## Language

All `.feature` files are written in US English: English Gherkin keywords and
English step text. Do not add a `# language:` header; English is the Gherkin
default. Every file starts directly with the `Feature:` line:

```gherkin
Feature: Descriptive title of the feature
```

Use only the English keywords:
- `Feature`
- `Background`
- `Scenario`
- `Scenario Outline`
- `Examples`
- `Given`
- `When`
- `Then`
- `And`
- `But`

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
Feature: Descriptive title of the feature
  As a <role>
  I want <action>
  So that <benefit>

  Background:
    Given the system is operational
    And a tenant "Example Clinic" is registered

  # --- Happy Path ---

  Scenario: Description of the success scenario
    Given the user "<role>" is authenticated in the tenant "Example Clinic"
    And <precondition>
    When <user action>
    Then <expected result>
    And <additional check>

  # --- Edge Cases ---

  Scenario: Description of edge case 1
    Given <edge case context>
    When <action>
    Then <expected result>

  Scenario: Description of edge case 2
    Given <edge case context>
    When <action>
    Then <expected result>

  # --- Error Scenario ---

  Scenario: Description of the error scenario
    Given <context>
    When <invalid action>
    Then the system must return an error
    And the message must state the reason for the failure

  # --- Multi-Tenant Isolation ---

  Scenario: Data of one tenant is not visible to another tenant
    Given a tenant "Clinic A" exists with registered data
    And a tenant "Clinic B" exists with registered data
    When the user of tenant "Clinic B" queries the data
    Then the data of tenant "Clinic A" must not be returned
    And only the data of tenant "Clinic B" must be visible
```

## Naming Convention

`.feature` files must follow the pattern:

```
NNN_adr_name.feature
```

- **NNN**: number of the ADR that originated the feature.
- **adr_name**: same name used in the corresponding ADR, in snake_case, without accents.

### Examples

| ADR | .feature file |
|-----|-----------------|
| `001_jwt_authentication.md` | `001_jwt_authentication.feature` |
| `002_multi_tenant_strategy.md` | `002_multi_tenant_strategy.feature` |
| `003_database_migration.md` | `003_database_migration.feature` |

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
Then the displayed message must be "Animal registered successfully!"
```

### ✅ Prefer — contextual assertion

```gherkin
Then the system must confirm the animal registration
And the animal must appear in the tenant's animal list
```

### Guidelines

- Use assertions that validate **behavior** and **state**, not literal texts.
- Check **side effects** (database records, emitted events) when relevant.
- Validate **absence of data** in multi-tenant isolation scenarios (e.g.: "must not be returned").
- Validate **HTTP status codes** in API scenarios when applicable (e.g.: "the system must return status 403").

## Role-Based Scenarios

Each test plan must consider the tavolo role hierarchy and include scenarios that validate access control. The hierarchy is:

```
superadmin > admin > coordinator > volunteer > veterinarian > viewer
```

### Scenario types per role

| Role | Typical scenarios |
|------|-----------------|
| **superadmin** | Full access, tenant management, cross-tenant operations |
| **admin** | Management of tenant users and settings |
| **coordinator** | Coordination of volunteers and scheduling |
| **volunteer** | Activity logging, animal follow-up |
| **veterinarian** | Medical records, prescriptions, clinical procedures |
| **viewer** | Read-only, no write permission |

### Template for a permission scenario

```gherkin
  Scenario Outline: Access to the feature by role
    Given the user with role "<role>" is authenticated
    When the user tries to <action>
    Then the system must <result>

    Examples:
      | role          | result                             |
      | superadmin    | allow the operation                |
      | admin         | allow the operation                |
      | coordinator   | allow the operation                |
      | volunteer    | deny the operation with status 403 |
      | veterinarian   | deny the operation with status 403 |
      | viewer  | deny the operation with status 403 |
```

## Full Example — Animal Registration

```gherkin
Feature: Animal registration
  As a coordinator
  I want to register a new animal in the system
  So that it can receive veterinary follow-up

  Background:
    Given the system is operational
    And a tenant "Hope Clinic" is registered
    And the database schema is configured via DATABASE_SCHEMA

  # --- Happy Path ---

  Scenario: Register an animal with valid data
    Given the user "coordinator" is authenticated in the tenant "Hope Clinic"
    And the following animal data is provided:
      | field     | value         |
      | name      | Rex           |
      | species   | Canine        |
      | breed     | Mixed breed   |
      | age       | 3 years       |
      | weight    | 12.5 kg       |
    When the user submits the registration request
    Then the system must confirm the animal registration
    And the animal "Rex" must appear in the animal list of tenant "Hope Clinic"
    And the record must contain the current registration date

  # --- Edge Cases ---

  Scenario: Register an animal with a name at the maximum character limit
    Given the user "coordinator" is authenticated in the tenant "Hope Clinic"
    When the user registers an animal with a 255-character name
    Then the system must accept the registration normally

  Scenario: Register an animal with zero weight
    Given the user "coordinator" is authenticated in the tenant "Hope Clinic"
    When the user registers an animal with weight "0"
    Then the system must reject the registration
    And it must state that the weight must be greater than zero

  # --- Error Scenario ---

  Scenario: Register an animal without required fields
    Given the user "coordinator" is authenticated in the tenant "Hope Clinic"
    When the user submits the registration request without the "name" field
    Then the system must return a validation error
    And it must state that the "name" field is required

  # --- Multi-Tenant Isolation ---

  Scenario: Animals of one tenant are not visible to another tenant
    Given the tenant "Hope Clinic" has the animal "Rex" registered
    And the tenant "Pet Health" has the animal "Luna" registered
    When the user "coordinator" of tenant "Pet Health" lists the animals
    Then the animal "Rex" of tenant "Hope Clinic" must not be returned
    And only the animal "Luna" must be visible

  # --- Role-Based Access Control ---

  Scenario Outline: Animal registration permission by role
    Given the user with role "<role>" is authenticated in the tenant "Hope Clinic"
    When the user tries to register a new animal
    Then the system must <result>

    Examples:
      | role          | result                                |
      | superadmin    | allow the registration                |
      | admin         | allow the registration                |
      | coordinator   | allow the registration                |
      | volunteer    | allow the registration                |
      | veterinarian   | allow the registration                |
      | viewer  | deny the registration with status 403 |

  Scenario: User with role viewer cannot edit an animal
    Given the user with role "viewer" is authenticated in the tenant "Hope Clinic"
    And the animal "Rex" is registered
    When the user tries to edit the data of animal "Rex"
    Then the system must deny the operation
    And it must return status 403
```
