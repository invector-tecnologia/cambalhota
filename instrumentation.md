# Diretrizes de Instrumentação para AI-Driven Development

Este documento estabelece os contratos arquiteturais e operacionais para o ecossistema *Spec-Driven Development* do projeto. A premissa central é que a documentação atua como a Única Fonte da Verdade. Coloque-o na pasta `docs/` do seu projeto.

Nenhuma linha de código deve ser gerada por humanos ou agentes sem a prévia especificação detalhada em arquivos Markdown padronizados.

## 1. Topologia de Documentação (Context Ingestion)

Para que os agentes de IA naveguem sem esforço cognitivo, os arquivos no diretório `/docs/` devem manter referências cruzadas entre si e com os arquivos em `/.agents/` e na raiz (`README.md`). O ecossistema é dividido nas seguintes camadas:

| Artefato | Localização | Escopo e Responsabilidade |
| :--- | :--- | :--- |
| **Features Map** | `/docs/product/features_map.md` | Documento vivo que define regras de negócio, comportamentos de interface, valor estratégico e status de implementação das funcionalidades por versão. |
| **Product Roadmap** | `/docs/product/roadmaps/` | Define o escopo de versões futuras com base no *Features Map*, incluindo uma análise de *benchmark* com os 5 principais concorrentes (um arquivo por versão de lançamento). |
| **Architecture Map** | `/docs/engineering/architecture_map.md` | Documento vivo que mapeia o plano técnico, a topologia de classes/eventos (Frontend/Backend) e o modelo de banco de dados. |
| **Constitution** | `/docs/engineering/constitution.md` | O contrato inegociável. Lista regras estritas que o agente jamais pode quebrar, incluindo restrições de bibliotecas ou padrões arquiteturais. |
| **ADRs** | `/docs/engineering/adrs/` | Registros de Decisão Arquitetural (ex: `001_nome_da_demanda.md`). Documentos imutáveis (Proposto/Aceito/Substituído) que detalham o contexto, *trade-offs* e consequências antes da implementação da engenharia. |

## 2. Linha de Montagem de Agentes (Mixture of Experts)

Para garantir a qualidade e a mitigação de alucinações, o projeto proíbe o uso de um agente generalista. A orquestração utiliza múltiplos agentes especializados, operando em cadeia e executando validações estritas.

*   **Agente `prod` (Produto):** Responsável por criar e iterar os documentos de negócios, garantindo a coesão entre o `features_map.md`, o `product_roadmap.md` e a `constitution.md`.
*   **Agente `arch` (Arquitetura):** Consome os artefatos de produto para planejar as execuções. É o responsável por atualizar o `architecture_map.md` e formular os planos técnicos no formato ADR.
*   **Agente `eng` (Engenharia):** Analisa o ADR específico em `/docs/engineering/adrs/` para sanar dúvidas antes de consumir recursos computacionais. Após o alinhamento, escreve o código-fonte base e a suíte de testes unitários, garantindo aderência absoluta à especificação inicial.
*   **Agente `qa` (Quality Assurance):** Consome os ADRs para gerar automaticamente planos de teste e cenários em formato Gherkin (Dado/Quando/Então), persistindo-os em `/docs/engineering/qa_plans/`.

### 2.1. Diretrizes de Automação de Qualidade (QA Avançado)

O Agente `qa` possui autonomia estendida para garantir a resiliência contínua do sistema:
*   **Testes Exploratórios:** Navegação autônoma em fluxos complexos para mapeamento de *edge cases* não previstos humanamente. Conversão direta de cenários em código executável.
*   **Auto-healing (Autocura):** Correção automática de localizadores de interface quebrados, reexecutando o pipeline sem intervenção humana.
*   **Triagem Inteligente:** Filtragem de falsos positivos, agrupamento de anomalias reais e geração de *reports* de *bugs* estruturados (com logs e capturas de tela) para o time de engenharia.
*   **Validação Semântica:** Substituição de asserções de texto exato por avaliações de contexto. O agente verifica se o resultado na interface faz sentido lógico para a regra de negócio, atualizando automaticamente o status no `features_map.md`.

## 3. Diretrizes de Execução (Code Generation Protocol)

Para mitigar alucinações e garantir a aderência contratual, a geração de código segue um fluxo de validação dupla:
1.  **Validação Técnica (Agente `eng`):** O agente deve consultar o ADR específico em `/docs/engineering/adrs/` antes de gerar código. O ADR deve conter a fundamentação lógica, *trade-offs* e consequências da decisão técnica.
2.  **Validação de Qualidade (Agente `qa`):** Após a geração do código, o Agente `qa` executa testes de validação semântica e testes exploratórios para garantir que a implementação faz sentido para a regra de negócio e não apenas tecnicamente.

## 4. Metodologia de Execução de Tarefas (Spec-Driven Workflow)

A adoção do padrão *Spec-Driven Development (SDD)* é um requisito inegociável para este projeto. O ciclo de vida de desenvolvimento deve seguir estritamente o fluxo de ingestão de especificações definido abaixo. A meta é eliminar a ambiguidade e garantir que a execução técnica esteja perfeitamente alinhada com a visão do produto.

### 4.1. Pré-requisito: A Engenharia da Tarefa (ADR)

Antes que qualquer geração de código possa ser iniciada, o contexto da tarefa deve ser formalizado por meio de um Registro de Decisão Arquitetural (ADR). Este passo é de responsabilidade exclusiva do agente `arch`.

1.  **Identificação:** O agente deve analisar o `features_map.md` para identificar uma funcionalidade ou item de produto que necessite de implementação técnica.
2.  **Formatação do ADR:** O agente deve criar (ou atualizar) um arquivo em `/docs/engineering/adrs/`. Este documento deve seguir o template padrão do projeto e conter, no mínimo:
    *   **Contexto:** Explicação clara da necessidade do negócio.
    *   **Decisão Técnica:** Detalhamento da arquitetura, padrões de projeto e tecnologias a serem utilizadas.
    *   **Trade-offs:** Discussão explícita das alternativas consideradas e os motivos para a escolha feita.
    *   **Consequências:** Análise das implicações da decisão no sistema atual.
    *   **Status:** Ciclo de vida (Proposto, Aceito, Implementado, Arquivado).
3.  **Alinhamento:** Uma vez criado, o ADR deve ser apresentado aos agentes `eng` e `qa` para garantir que o contexto técnico seja compartilhado antes do início do desenvolvimento.

### 4.2. Fluxo de Execução Técnica

Com o ADR aprovado e compreendido, o fluxo de execução prossegue da seguinte forma:

1.  **Geração de Código (Agente `eng`):**
    *   **Consulta Obscrigatória:** O agente `eng` deve obrigatoriamente ler o ADR correspondente em `/docs/engineering/adrs/` para sanar quaisquer dúvidas contextuais ou arquiteturais antes de gerar código.
    *   **Implementação:** O agente escreve o código-fonte seguindo estritamente as especificações do ADR.
    *   **Testes Unitários:** Simultaneamente à geração do código de produção, o agente deve gerar a suíte de testes unitários correspondente. Isso garante que o código é verificável desde o momento da criação.

2.  **Validação de Qualidade (Agente `qa`):**
    *   **Geração de Planos:** O agente `qa` consome o ADR e gera planos de teste detalhados em formato Gherkin (`.feature`), armazenando-os em `/docs/engineering/qa_plans/`. Este passo formaliza os cenários que serão validados.
    *   **Execução Automática:** O agente `qa` executa os testes (sejam eles automatizados baseados nos planos, exploratórios ou de autocura) para validar a implementação feita pelo agente `eng`.
    *   **Feedback:** O agente fornece feedback estruturado sobre a aderência da implementação às especificações. Anomalias ou falhas são reportadas e, se necessário, o ciclo de correção é iniciado.



## 5. Processo de Geração e Refinamento de Código (Code Generation Loop)

A geração de código para funcionalidades ou itens de produto especificados em `/docs/product/features_map.md` deve seguir obrigatoriamente o ciclo de vida de refinamento iterativo descrito abaixo. Este processo garante a mitigação de alucinações e a aderência estrita às especificações definidas antes do consumo de recursos computacionais.

### 5.1. Fase 1: Geração da Engenharia de Software (Iteração 0)

Esta fase é responsável pela tradução da especificação de produto para um plano de execução técnica concreto.

1.  **Identificação e Contextualização:**
    *   O agente deve analisar o `features_map.md` para identificar uma funcionalidade ou item de produto que necessite de implementação técnica.
    *   O agente deve criar (ou atualizar) um Registro de Decisão Arquitetural (ADR) em `/docs/engineering/adrs/`. Este documento deve seguir o template padrão do projeto e conter, no mínimo: contexto da necessidade, decisão técnica detalhada, trade-offs considerados, consequências da decisão e status do ciclo de vida (Proposto).

2.  **Geração de Código Inicial (`eng`):**
    *   O agente `eng` deve consultar o ADR recém-criado em `/docs/engineering/adrs/` para sanar dúvidas contextuais e arquiteturais.
    *   O agente deve escrever o código-fonte base da funcionalidade em desenvolvimento, seguindo estritamente as especificações do ADR.
    *   **Testes Unitários:** Simultaneamente à geração do código de produção, o agente `eng` deve gerar a suíte de testes unitários correspondente. Isso garante que o código é verificável desde o momento da criação.

3.  **Validação Técnica e Planejamento (`qa`):**
    *   O agente `qa` deve consultar o ADR em `/docs/engineering/adrs/` para gerar planos de teste detalhados em formato Gherkin (`.feature`), armazenando-os em `/docs/engineering/qa_plans/`. Este passo formaliza os cenários que serão validados.
    *   O agente `qa` deve executar os testes de validação semântica e testes exploratórios para garantir que a implementação feita pelo agente `eng` faz sentido para a regra de negócio e não apenas tecnicamente.

4.  **Loop de Refinamento:**
    *   Se o agente `qa` identificar falhas na aderência à especificação ou anomalias, ele deve gerar um relatório de feedback estruturado.
    *   O agente `eng` deve analisar o feedback e corrigir o código-fonte e os testes unitários. Este processo deve repetir-se até que o agente `qa` considere a implementação aderente à especificação.
    *   Uma vez validada tecnicamente, o agente `eng` deve atualizar o status do ADR para "Implementado".

5.  **Refinamento de Produto (`prod`):**
    *   Após a validação técnica, o agente `prod` deve analisar o código implementado e os planos de teste para atualizar o `features_map.md`.
    *   Esta atualização deve refletir o estado atual da funcionalidade, incluindo detalhes de implementação, casos de teste validados e quaisquer observações relevantes para futuras iterações.

### 5.2. Gestão de Dependências e Orquestração

O fluxo de execução deve ser orquestrado pelos agentes de acordo com as diretrizes do `features_map.md`.

*   O agente `arch` é o responsável pela geração e atualização dos `adrs`.
*   O agente `eng` é o responsável pela geração e atualização do código-fonte e dos testes unitários.
*   O agente `qa` é o responsável pela geração e atualização dos planos de teste e pela execução dos testes.
*   O agente `prod` é o responsável pela geração e atualização do `features_map.md`. 

## 6. Arquitetura de Software (Software Architecture)

O projeto adota uma arquitetura em camadas com clara separação de responsabilidades, seguindo princípios de **Domain-Driven Design (DDD)** para garantir escalabilidade e manutenibilidade.

*   **Camada de Domínio (Domain Layer):** Contém a lógica de negócio pura (Core Business Rules), entidades, objetos de valor e repositórios. É isolada de frameworks e detalhes de infraestrutura.
*   **Camada de Aplicação (Application Layer):** Orquestra o fluxo de dados entre o domínio e as camadas externas. Expõe APIs de aplicação (Interfaces de Usuário, APIs REST, Serviços).
*   **Camada de Infraestrutura (Infrastructure Layer):** Responsável por detalhes técnicos como persistência de dados (ORM/Drivers), integrações externas (APIs de terceiros) e transporte (HTTP/WebSockets).
*   **Camada de Interface (Presentation Layer):** Interfaces com o usuário final (Web App, Mobile).
