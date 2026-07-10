# Etapas do BRO para AiDD  
## Iniciando um projeto com AiDD
### Estapa de descrição do projeto
Descreva no arquivo `/docs/scope.md`:   
- O propósito do projeto e seu público alvo.
- As funcionalidades principais do projeto (MLP), em forma de listagem ranqueada.
- O estilo de  layout do projeto.
- O que não pode conter no projeto.
- As tecnologias de frontend, backend, banco de dados e infraestrutura que seão utilizadas no projeto.

### Etapa de instrumentação
Inclua tudo abaixo no arquivo `/docs/instrumentation.md`.
A documentação é "Única Fonte da Verdade". Escreva especificações claras e detalhadas antes de iniciar qualquer código utilizando arquivos Markdown Padronizados.
Todos os arquivos em `/docs/` devem ser referênciados entre si e com os arquivos padrões contidos em `/.agents/` e `README.md` do projeto, para que os agentes de ia possam consultá-los sem esforço cognitivo.
- O projeto é organizado com arquivos específicos que o agente de ia entende com facilidade, como:
  - `features_map.md`: define o objetivo e a regra de negócio, todas as funcionalidades, seus comportamentos de tela, seu valor de negócio, qual a versão do produto a feature está prevista de ser implementada e seus status de implementação. Contido na pasta `/docs/product`. Esse documento é vivo.
  - `product_roadmap.md`: define o escopo das versões futuras do produto, tomando como base o `features_map.md` e contendo um benchmark de concorrentes e liste os top 5 concorrentes. Existe um desse por versão de lançamento o produto. Contido na pasta `/docs/product/roadmaps/`. 
  - `architecture_map`: define o plano técnico e a arquitetura da camada de classes e eventos do frontend e do backend do projeto e da camada de banco de dados do projeto. Contido na pasta `/docs/engineering/`. Esse documento é vivo.
  - `constitution.md`: Lista as regras imutáveis que o agente de ia jamais deve quebrar (ex: bibliotecas proibidas). Contido na pasta `/docs/engineering/`.
  - Arquivos ADRs: define o plano técnico de implementação. Esse arquivo é distinto por atuação do agente de ia `eng` e deve ter prefixo numerado seguindo o modelo: `###_descrição_curta_da_demanda.md`.  Contido na pasta `/docs/engineering/adrs/`.
    - Um Registro de Decisão Arquitetural (ADR) é um documento conciso que captura uma decisão técnica específica, seu contexto e suas principais ramificações para o produto. Seu propósito é duplo: atuar como um log histórico para que as equipes compreendam as motivações estruturais no longo prazo e, estrategicamente, forçar a clareza de raciocínio e o alinhamento, expondo e resolvendo divergências durante o próprio processo de formulação da documentação.
    - Estruturalmente, os ADRs devem seguir a lógica da "pirâmide invertida" — priorizando as informações críticas no início — e costumam ser armazenados no próprio repositório de código (em formatos leves como Markdown) para manter a proximidade com a operação. Eles seguem um ciclo de vida de status estrito ("proposto", "aceito" e "substituído"); uma vez aceita, uma decisão nunca é modificada, apenas substituída por um novo documento se o cenário mudar, garantindo uma rastreabilidade exata de quanto tempo cada diretriz governou o trabalho.
    - No detalhe, um ADR exige não apenas o veredito, mas a fundamentação lógica que o originou, mapeando claramente o problema, os trade-offs assumidos, as alternativas viáveis descartadas, o nível de confiança e as consequências esperadas. Devido ao seu foco em brevidade e na extração de expertise técnica (Advice Process), a prática de manter esses registros curtos e imutáveis transcende o ecossistema de software, estabelecendo um padrão arquitetural de excelência para justificar historicamente a evolução de qualquer decisão estratégica dentro da corporação.  
    - Antes de iniciar a criação do código, o agente analisa a especificação e interage com o humano para remover qualquer dúvida. Isso garante que a máquina compreendeu o resultado esperado antes de gastar tempo e recursos (tokens) escrevendo o código.
    - O agente de ia lê essas regras e cria o software baseando-se estritamente nelas, o que diminui o risco de invenções ou códigos desnecessários. Divisão de Agentes em Cadeia Em vez de usar apenas um agente para tudo, a estratégia utiliza múltiplos agentes especializados em uma linha de montagem.

#### Agents:
O projeto seja Instrumentado para utilizar todos os recursos que o antigravity pode proporcionar para um AI Driven Development assertivo e de qualidade, levando em conta os documentos contidos na pasta de documentação.
Deve conter agentes customizados garantindo o spec driven development:   
- Agente `prod`:
   - Cria e atualiza os documentos: `features_map.md`, `product_evolution_roadmap.md` com base no `features_map.md` e `constitution.md`.
- Agente `arch`:
  - Cria e atualiza o documento: `architecture_map`.
  - Lê o `features_map.md` e o `product_evolution_roadmap.md`, planeja e cria o plano de execução no formato ADR.    
- Agente `eng`:
  - Lê e atualiza o arquivo ADR contido em `/docs/engineering/` específicado.       
  - Escreve o código base e os testes unitários.
  - Checa se o código final obedece exatamente às especificações iniciais.
- Agente `qa`:
  - Gera os Casos de Teste: O agente de ia lê os documentos ADRs contido em `/docs/engineering/adrs/` e gera planos de teste e cenários em formato Gherkin (Dado/Quando/Então) automaticamente. Isso garante que nenhum caso de uso importante seja esquecido na fase de planejamento. Persistindo os planos de teste na pasta `/docs/engineering/qa_plans/`. 
  - Testes Exploratórios Autônomos: O agentes de ia navegam pela aplicação sem scripts prévios. Eles exploram menus, formulários e fluxos complexos para encontrar falhas inesperadas ou cenários de exceção que os humanos não programaram para testar.
  - Automação Inteligente, Auto-healing (Autocura) e Geração de scripts. O agente de ia pode converter cenários de teste em código executável.
  - Autocura: Se uma tela mudar (ex: um botão ganhar um nome novo que quebra o script de teste automatizado), o agente de ia corrige o localizador do elemento sozinho e roda o teste novamente sem intervenção humana.
  - Triagem e Depuração de Bugs: Após uma bateria de testes, o agente analisa os resultados, filtra "falsos positivos" e agrupa os erros reais. Ele captura logs e capturas de tela (screenshots) e já redige um relatório detalhado de bug para o time de desenvolvimento.
  - Validação de Regras de Negócio e Conteúdo: Em vez de buscar correspondências de texto exatas (que quebram fácil), o agente de ia usa asserções semânticas. Avalia se o resultado na tela faz sentido para o contexto esperado, garantindo qualidade em textos, resumos e dados.
  - Atualiza o status da implementação das features no arquivo `features_map.md`

### Estapa de execução do projeto
1. Planejamento:
  - Utilize para isso ferramentas AiDD com o comando `/prod` com um bom modelo com uma quantidade ciclo de cognitivo alta, instruindo-o que ele siga o que foi descrito em `/docs/product/scope.md`.
  - Utilize para isso ferramentas AiDD com o comando `/arch` com um bom modelo com uma quantidade ciclo de cognitivo alta e reforçando que siga restritamente o que foi descrito nos arquivos contidos na pasta `/docs/product/` e `/docs/engineering/`.
3. Execução: Utilize para isso ferramentas do AiDD com o comando `/eng` com um bom modelo com uma quantidade ciclo de cognitivo baixo e reforçando que siga restritamente o que foi descrito nos arquivos contidos na pasta `/docs/engineering/adrs/`.
4. Testes: Utilize para isso ferramentas do AiDD com o comando `/qa` com um bom modelo com uma quantidade ciclo de cognitivo baixo e reforçando que os testes sigam restritamente o que foi planejado.
