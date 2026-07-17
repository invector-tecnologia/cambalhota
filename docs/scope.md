# Escopo Estratégico do Projeto (PRD) - Cambalhota

Este documento estabelece as diretrizes fundamentais de negócios, as fronteiras de atuação e as fundações tecnológicas do Tavolo. Ele atua como o contrato principal entre as áreas de Produto, Liderança Técnica e Engenharia.

## 1. Proposta de Valor e Priorização (Matriz MoSCoW)
A definição de escopo segue uma ordem estrita de prioridade focada em viabilidade, ROI e tempo de lançamento (Time-to-Market). O sistema engloba tanto a extração e backup seguro de dados/esquemas em nuvem (ou local), quanto o gerenciamento avançado de migrações estruturais de banco de dados, tendo o Flyway e o Liquibase como benchmarks.

*   **1.1. Requisitos Críticos (Must-Have):**     
    *   O sistema será agnóstico e multi-engine, capaz de realizar extração de metadados e dados de múltiplos bancos de dados (PostgreSQL, Oracle, MSSQL, MySQL, SQLite, SPANNER, INDEDB, VECTORDB, BigQuery, CouchDB, MongoDB, etc). O Extrator utilizará a saída padrão das CLIs e utilitários nativos de cada engine (ex: pg_dump, mysqldump, expdp, sqlcmd, sqlite3, mongodump, bq extract, etc) e apresentará o resultado em um formato padronizado.
    *   O sistema persistirá os arquivos de backup extraídos e encriptados por padrão no diretório local `~/.cambalhota/db_dumps/YYYY/`.
    *   O sistema fará a restauração (restore) do schema, suas tabelas e seus dados que foram previamente extraídos. Ele será capaz de listar os backups que existem persistidos no ambiente local do host (`~/.cambalhota/db_dumps/YYYY/`).
    *   O sistema será capaz de gerar automaticamente arquivos de migration com rotinas de up e down.
    *   O sistema será capaz de comparar duas versões do banco de dados e gerar arquivos de migration com as diferenças encontradas.
    *   O sistema será capaz de executar a sequência de arquivos de migration, monitorar a sua execução e realizar controle de versão estrutural.
    *   O sistema será capaz de gerar relatórios de sucesso e falha na execução dos arquivos de migration e apresentar na tela do usuário.
*   **1.2. Requisitos Estratégicos (Should-Have):** 
    *   A aplicação será capaz de gerar documentação técnica (em Markdown) e arquivos de teste (SQL DDL/DML) com base no schema extraído.
    *   O sistema exigirá a configuração de um repositório Git ou "CDN" (ex: Dropbox, Google Drive, OneDrive, GCP buckets, Cloudflare R2, etc.) para fazer o upload e armazenamento redundante dos arquivos de backup extraídos, aplicando compressão de dados antes do envio.
*   **1.3. Requisitos de Aprimoramento (Nice-to-Have):** 
    *   A aplicação será capaz de gerar representações visuais do schema extraído.

## 2. Domínio de Usuários (Atores e Público-Alvo)
Mapeamento claro dos usuários que interagem com o sistema, para guiar o *Domain-Driven Design* (DDD) e a gestão de permissões.

*   **2.1. Usuários Técnicos**
    *   **Desenvolvedores de Software:** Interagem com o sistema para extrair esquemas, gerenciar migrações, gerar documentação técnica e arquivos de teste com base no schema.
    *   **Administradores de Banco de Dados (DBAs):** Interagem com o sistema para realizar extrações e backups estruturados, monitorar migrações, listar e restaurar backups a partir de um repositório Git/CDN, e auditar alterações estruturais.

## 3. Topologia de Funcionalidades Core

*   **3.1. Configuração do Sistema e Conexão**
    *   O sistema será capaz de configurar as credenciais de acesso aos bancos de dados usando a URL de conexão fornecida.
    *   O sistema deve permitir o cadastro de múltiplas conexões pela interface gráfica, armazenando as senhas de maneira segura (criptografia AES) em um banco local SQLite, eliminando o uso de variáveis de ambiente.
    *   O sistema será capaz de identificar e apresentar os nomes dos schemas existentes para que o usuário selecione qual deseja extrair/operar.
    *   O sistema será capaz de configurar o formato de geração dos arquivos de migration (Plain ou SQL).
*   **3.2. Extração (Backup) e Persistência**
    *   O sistema será capaz de realizar a extração de metadados e dados de forma agnóstica para todos os bancos suportados, acionando seus utilitários CLI padrão nos bastidores, e apresentar o resultado padronizado.
    *   O sistema fará a persistência dos arquivos de backup gerados e encriptados diretamente no disco local em `~/.cambalhota/db_dumps/YYYY/`.
*   **3.3. Restauração (Restore)**
    *   O sistema listará dinamicamente todos os backups disponíveis no ambiente local do host em `~/.cambalhota/db_dumps/YYYY/`.
    *   O sistema fará o restore completo (schema, tabelas e dados) a partir de um backup local listado e selecionado pelo usuário.
    *   O sistema permitirá o restore cruzado (cross-database restore), possibilitando gerar o dump de uma conexão origem e restaurar os dados em uma conexão destino previamente cadastrada.
*   **3.4. Geração e Execução de Migrations**
    *   O sistema gerará arquivos de migration com rotinas de up e down.
    *   O sistema comparará duas versões do banco de dados e gerará arquivos de diff (migration).
    *   O sistema executará e auditará as migrations com controle de versão robusto (nível Flyway/Liquibase).
    *   O sistema apresentará relatórios de sucesso/falha de execução na interface.
*   **3.5. Documentação Técnica e Visualização**
    *   Geração de documentação técnica em Markdown e arquivos de teste (DDL/DML).
    *   Geração de visualizações do schema extraído.
*   **3.6. Segurança e Otimização de Payload**
    *   O sistema criptografará os arquivos com uma chave de segurança local no momento da criação, salvando as versões em disco encriptadas por padrão.
    *   O sistema comprimirá os arquivos extraídos em tempo real (streams) futuramente para minimizar uso de rede na integração com nuvem.

## 4. Fronteiras e Proteção de Escopo (Out of Scope)
Para blindar o time de engenharia contra *scope creep* e garantir o foco arquitetural.

*   **4.1. Restrições Absolutas (Forbidden):** 
    *   O sistema não deve armazenar credenciais de acesso aos bancos de dados ou aos serviços de CDN/Git em texto pleno no repositório de código.

## 5. Diretrizes de Interface e Experiência (UX/UI)
Contratos visuais e referências de benchmark para o desenvolvimento das camadas de apresentação.

*   **5.1. Padrões Visuais (Design System):** Utilizar Terminal User Interface (TUI) com as seguintes diretrizes:
    - Layout em modo escuro (dark mode)
    - Paleta de cores primária: `#2E3440`
    - Destaques: `#88C0D0` (informação), `#BF616A` (alerta), `#A3BE8C` (sucesso)
    - Tipografia: `Monoid`, tamanho 13px
    - Layout baseado em abas e painéis verticais
    - Uso de bordas arredondadas (`corner_radius`)
    - Padding lateral de `16px`
    - Exibição de uma Logo do projeto em formato ASCII Art 'Retrowave' fixada no canto superior esquerdo da tela.

## 6. Fundações Tecnológicas (Stack Baseline)
Definição do ecossistema técnico aprovado pela liderança para sustentar a operação.

*   **6.1. Camada de Apresentação (Frontend TUI):** [Tatuí](https://github.com/invector-tecnologia/tatui)
*   **6.2. Camada de Negócios (Backend):** [Nim](https://github.com/nim-lang/nim)
*   **6.3. Camada de Persistência (Database):** [db-schema-data-dump](https://github.com/invector-tecnologia/db-schema-data-dump)
*   **6.4. Infraestrutura e Operações (Infra/DevOps):** Terminal / CLI
