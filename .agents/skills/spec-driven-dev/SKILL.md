---
name: spec-driven-dev
description: "Use when delivering features with specification-first execution: plan task authoring, acceptance criteria definition, implementation mapping, and evidence-based completion."
---

# Spec Driven Development Skill

This skill enforces a specification-first methodology for implementing features or tasks. It ensures that no code is written without prior definition of measurable acceptance criteria, maintaining clear traceability between requirements and execution.

## Use When

- A feature request is ambiguous and requires explicit, measurable acceptance criteria before development begins.
- A complex task must be decomposed into smaller, verifiable, and incremental steps.
- You need to validate that the implementation strictly matches the documented scope and does not introduce unplanned changes (scope creep).
- You are transitioning a task from "in-progress" to "completed" and must provide evidence of success.

## Key Principles

- **Traceability**: Every code change should trace back to a specific requirement or criterion in the task specification.
- **Verifiability**: Acceptance criteria must be objective and measurable (e.g., using Given/When/Then formatting).
- **Evidence-Based**: Task completion is proven through logs, test results, or screenshots, not just assertions.

## Workflow

### 1. Spec Discovery & Scoping

- Locate the primary execution plan or task specification document (e.g., within the `docs/Tavolo_Execution_Plans/` directory).
- Review the overarching goal and identify the specific task block assigned to the current iteration.

### 2. Acceptance Criteria Definition

- Detail explicit, testable conditions that must be met for the task to be considered complete.
- Use structured formats if beneficial (e.g., **Given** a state, **When** an action occurs, **Then** an outcome is expected).
- Document these criteria in the task tracking artifact (e.g., `task.md`) before writing code.

### 3. Implementation Mapping

- Plan the exact files to be modified, created, or deleted.
- Map each code change directly to an established acceptance criterion to ensure relevance and prevent drift.

### 4. Validation & Evidence Gathering

- Execute relevant validation commands (e.g., unit tests, type checks, linting, or functional UI tests).
- Run `npm test`, `npm run lint`, or `npm run typecheck` as dictated by the quality gates.
- Capture the terminal output or errors as objective evidence.

### 5. Completion & Handoff

- Update the task specification or tracking artifact with links to the validation evidence.
- Note any residual risks or technical debt incurred during the implementation.
- Mark the task as fully complete (`[x]`) only when all criteria are demonstrably met.

## Outputs

- **Updated Task Scope**: Clearly defined bounds for the implementation.
- **Acceptance Checklist**: A verifiable list of requirements.
- **Validation Evidence**: Command outputs, test results, or UI confirmation.
- **Completion Decision**: Formal declaration of task conclusion based on evidence.
