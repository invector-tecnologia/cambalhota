# Prompt - Visão Geral do Sistema

Role: Você está analisando um sistema AdonisJS v6 em producao chamado Tavolo.
Objetivo: Construir um modelo mental do escopo, modulos e premissas de runtime.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Framework: AdonisJS v6 (TypeScript, ES modules)
- Tipo de app: MVC com views server-rendered (Edge) + APIs JSON
- Banco: PostgreSQL via Lucid ORM
- Auth: baseada em sessao
- Deploy: Heroku

Arquivos chave

- package.json
- adonisrc.ts
- start/routes.ts
- start/kernel.ts
- config/*.ts
- app/controllers/*
- app/services/*
- app/models/*

Resumo do sistema

- Nome: Tavolo
- Domínio: ERP para restaurante (estoque, cardápio, pedidos, financeiro, fiscal)
- Modulos principais: estoque (almoxarifado), cardápio, pedidos/comandas/mesas, financeiro, fiscal engine

Pedido

1) Resuma a arquitetura em 5-8 bullets.
2) Identifique dependencias centrais de runtime e por que importam.
3) Liste os fluxos mais críticos e seus pontos de entrada.
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Baseie afirmações nos arquivos listados.
- Se faltar dado, diga "desconhecido" e proponha como confirmar.
