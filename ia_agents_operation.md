Operação de execução AI-Driven

Este documento estabelece o fluxo estrito de operações para o ciclo de vida de desenvolvimento (SDLC) utilizando o ecossistema de AI-Driven Development (AiDD). A governança deste pipeline garante que a alocação de recursos computacionais (tamanho e custo do modelo de IA) seja matematicamente otimizada para a complexidade da tarefa, mantendo fidelidade absoluta às documentações arquiteturais.

1. Fase de Planejamento e Desenho de Solução (Alta Carga Cognitiva)
Nesta etapa, o esforço computacional e financeiro deve ser direcionado para LLMs de raciocínio profundo e alta capacidade analítica. O objetivo é garantir o alinhamento irreversível de negócios e arquitetura antes de escrever qualquer código.

Engenharia de Produto (/prod): Invoque o agente de produto exigindo um modelo com alto ciclo cognitivo. A diretriz imperativa de operação é a obediência estrita às fronteiras e requisitos já estabelecidos no artefato de origem: /docs/product/scope.md.

Engenharia de Arquitetura (/arch): Invoque o agente de arquitetura mantendo o padrão de alto ciclo cognitivo. O modelo deve ser parametrizado para consumir e respeitar integralmente os contratos e constraints definidos nos diretórios /docs/product/ e /docs/engineering/.

2. Fase de Execução e Codificação (Baixa Carga Cognitiva)

A transição para a escrita de código abandona a fase de ideação e exige execução puramente determinística. A utilização de LLMs complexos (e caros) nesta etapa caracteriza desperdício orçamentário.

Implementação Técnica (/eng): Orquestre o agente de engenharia utilizando um modelo de baixo ciclo cognitivo (rápido, barato e otimizado para código). O contrato de execução exige que o agente atue exclusivamente sob os parâmetros delineados nos Registros de Decisão Arquitetural (ADRs) mapeados na rota /docs/engineering/adrs/. Invenções de escopo são proibidas.

3. Fase de Validação e Quality Assurance (Baixa Carga Cognitiva)

A garantia de qualidade operará como uma esteira de auditoria determinística, validando o trabalho da Fase 2 contra os contratos da Fase 1.

Testes e Automação (/qa): Acione o agente de QA utilizando um modelo de baixo ciclo cognitivo. A instrução inegociável é a geração e execução de casos de teste que reflitam metodicamente o planejamento prévio. É vedada a criação de cenários de teste não mapeados nos ADRs ou no escopo do produto.
