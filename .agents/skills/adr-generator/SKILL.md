---
name: adr-generator
description: >
  Gera Registros de Decisão Arquitetural (ADRs) padronizados para o projeto tavolo.
  Ativar quando o agente arch precisar criar um novo ADR, planejar uma decisão técnica,
  ou documentar trade-offs arquiteturais na stack AdonisJS.
---

# Gerador de ADRs (Architecture Decision Records)

Esta skill orienta o agente [arch](../arch/agent.md) na criação de ADRs no projeto tavolo, garantindo consistência com a arquitetura estabelecida (AdonisJS, Lucid, Edge.js, Tailwind).

## 1. Localização e Nomenclatura

- **Diretório**: `docs/engineering/adrs/`
- **Formato do arquivo**: `NNN_titulo_descritivo_curto.md`
  - `NNN` = Número sequencial com 3 dígitos (ex: `001`, `002`, `003`).
  - O título deve ser snake_case ou kebab-case sem caracteres especiais.
  - Exemplo: `docs/engineering/adrs/005_emissao_fiscal_nfe.md`.

## 2. Template Obrigatório

Todo ADR deve seguir a estrutura abaixo. **Nenhuma seção pode ser omitida.**

```markdown
# ADR-NNN: Título da Decisão (Ex: Estratégia de Cache para Relatórios Fiscais)

- **Status:** Proposto | Aceito | Implementado | Substituído | Arquivado
- **Data:** AAAA-MM-DD
- **Autores:** Agente arch (Tavolo AI)

## 1. Contexto
- Qual é o problema de negócio ou desafio técnico?
- Descreva o cenário no contexto de um restaurante/ERP (ex: Garçons estão tendo gargalos ao fechar comandas, PDV offline).

## 2. Decisão
- O que estamos decidindo de fato?
- Arquitetura, fluxo de classes AdonisJS, estrutura de tabelas, integração (ex: SEFAZ).
- (Opcional, mas recomendado) Diagrama Mermaid da solução proposta (Fluxo C4 ou Sequência).

## 3. Trade-offs Considerados
- Alternativa A: Vantagens x Desvantagens.
- Alternativa B: Vantagens x Desvantagens.
- Por que a Decisão foi escolhida ao invés das outras?

## 4. Consequências
- **Positivas:** Ganhos obtidos com a adoção.
- **Negativas/Riscos:** Débitos técnicos, curva de aprendizado, complexidade introduzida.

## 5. Referências
- Links para issues, features_map, docs do AdonisJS, etc.
```

## 3. Restrições Arquiteturais do Projeto (AdonisJS Stack)

Ao propor soluções, o agente **arch** deve respeitar incondicionalmente a base tecnológica definida:

1. **Backend**: AdonisJS v6 (Node.js + TypeScript). Regras de negócio vivem em `app/services/`.
2. **Banco de Dados**: PostgreSQL com schema restrito (`tavolo`). ORM: Lucid ORM. Migrations são obrigatórias.
3. **Validação**: Vine.js.
4. **Frontend**: Renderização server-side via Edge.js + Tailwind CSS.
5. **Multi-tenancy**: Todas as tabelas que guardam dados de restaurante devem estar vinculadas a um `empresa_id` e o isolamento deve ser garantido no nível do Service ou Middleware.
6. **Deploy**: O deploy é Heroku. Tarefas demoradas e jobs em background não podem bloquear o Dyno Web (se for o caso, devem usar bullmq/redis ou serviços gerenciados adequados).

## 4. Fluxo de Criação

1. Analisar a demanda do negócio.
2. Identificar a solução tecnológica no ecosistema AdonisJS/Node.js.
3. Redigir o ADR usando o comando `write_to_file`.
4. Definir o `Status: Proposto`.
5. Apresentar um resumo para validação (se interativo) ou avançar o status para `Aceito` no fluxo assíncrono.
