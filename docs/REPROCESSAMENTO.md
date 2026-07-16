# Reprocessamento de dados

## Objetivo

Reexecutar regras de negocio para recuperar falhas em processos criticos (estoque, desconto, fiscal, etc).

## Rotas relacionadas

- UI: /admin/processing
- UI: /admin/processing-rules

## Conceitos

- Regras de processamento definem handlers para cada entidade.
- Eventos registram cada tentativa.
- Status por entidade mostra pendencias e falhas.

## Fluxo basico

1. Entidade criada.
2. ProcessingEngine executa regras na ordem de prioridade.
3. Falhas ficam disponiveis no painel.
4. Admin reprocessa regras especificas ou todas.

## Como integrar novas entidades

- Registrar handler no service.
- Criar regra no painel com o handler.

## Utilidades

- SQLs e detalhes do modelo estao no arquivo de implementacao tecnica.
