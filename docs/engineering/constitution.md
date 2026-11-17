# Engineering Constitution — Cambalhota

> **Inviolable contract.** This document is the supreme engineering law of the Cambalhota project. Every agent, developer or CI/CD pipeline **MUST** obey the rules listed here.

## 1. Database and Storage Rules

| # | Rule | Level |
|---|-------|-------|
| DB-01 | ⛔ Database and CDN credentials must **NEVER** exist in the source code in plain text. | ⛔ Forbidden |
| DB-02 | ✅ Mandatory support for Multiple Relational Engines: PostgreSQL, MySQL and SQL Server. | ✅ Mandatory |
| DB-03 | ✅ Every extracted dump must be persisted remotely (CDN or Git) and listed in an auditable way. | ✅ Mandatory |

## 2. Architecture and Code Rules

| # | Rule | Level |
|---|-------|-------|
| ARQ-01 | ✅ The Backend/CLI MUST be written in **Nim**, prioritizing stability and fast I/O. | ✅ Mandatory |
| ARQ-02 | ✅ The Frontend MUST be a TUI (Terminal User Interface) based on the **Tatuí** framework. | ✅ Mandatory |
| ARQ-03 | ✅ Migrations (Up/Down) must follow versioning standards comparable to Flyway and Liquibase. | ✅ Mandatory |
