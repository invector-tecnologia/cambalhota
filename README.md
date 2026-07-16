# 🍽️ TAVOLO - Sistema Completo de Gestão para Restaurantes

[![AdonisJS](https://img.shields.io/badge/AdonisJS-v6-5A45FF)](https://adonisjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/tests-49%20passed-brightgreen)](./tests)
[![Coverage](https://img.shields.io/badge/coverage-100%25-success)](./MESAS_COMANDAS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Sistema ERP completo para restaurantes, bares e lanchonetes com gestão integrada de estoque, cardápio, pedidos, vendas e financeiro.

**🌐 Demo ao vivo:** Disponível mediante solicitação  
**📦 Versão Atual:** v6.0.0 (Estoque + TDD)  
**📅 Última Atualização:** 30/12/2025

## 📖 Sobre o Projeto

O **TAVOLO** é um sistema completo de gestão desenvolvido especificamente para estabelecimentos gastronômicos. Integra todos os aspectos operacionais do restaurante em uma única plataforma, desde o controle de estoque até o fechamento do caixa.

### 🎯 Principais Funcionalidades

#### 📦 **Gestão de Almoxarifado**

- ✅ Cadastro completo de fornecedores (nome, CNPJ, contatos, endereço)
- ✅ Controle de insumos com categorias (Carnes, Bebidas, Massas, etc.)
- ✅ Importação automática de NFe via XML
- ✅ Controle de estoque com unidades de medida
- ✅ Alertas de estoque mínimo e máximo
- ✅ Visualização detalhada de itens de notas fiscais

#### 🍽️ **Gestão de Cardápio**

- ✅ Organização por categorias customizáveis
- ✅ Receitas detalhadas com ingredientes e quantidades
- ✅ Cálculo automático de custo dos pratos
- ✅ Controle de margem de lucro por item
- ✅ Gestão de disponibilidade e destaque
- ✅ Upload de imagens para produtos
- ✅ Cardápio virtual para clientes

#### 🏪 **Gestão de Mesas, Comandas e Pedidos**

- ✅ **Sistema de Mesas** (v6.0.0 - CONSOLIDADO ✨)
  - Mesas como agrupamento opcional de comandas
  - CRUD completo com filtros e buscas
  - Contador de comandas por mesa
  - Status ativo/inativo e localização
  - Estatísticas de ocupação
  - 39 testes automatizados com TDD (zero acoplamento BD)
- ✅ **Comandas Independentes**
  - Comandas podem existir sem mesa (delivery, balcão)
  - Vinculação opcional a mesas
  - Transferência entre mesas
  - Filtro por mesa
- ✅ Sistema de pedidos com 7 status (pendente, confirmado, preparando, pronto, servido, pago, cancelado)
- ✅ Dashboard da cozinha estilo Kanban (pendente → preparando → pronto)
- ✅ Integração cardápio ↔ pedidos ↔ comandas ↔ mesas
- ✅ Tipos de pedido: Salão, Retirada, Delivery
- ✅ Carrinho interativo com atualização de totais em tempo real
- ✅ Controle de descontos e taxas de serviço
- ✅ Timeline de histórico de pedidos

#### 💰 **Gestão Financeira**

- ✅ Registro automático de vendas
- ✅ Controle de caixa diário (abertura/fechamento com saldo inicial/final)
- ✅ Múltiplas formas de pagamento (Dinheiro, Cartão, PIX)
- ✅ Análise de lucratividade por venda
- ✅ Filtros por período e método de pagamento
- ✅ Cálculo automático de custos e margens

#### 👥 **Gestão de Usuários**

- ✅ Sistema de autenticação com sessões
- ✅ Controle de permissões por papel (Garçom, Gerente, Admin)
- ✅ Cadastro e edição de usuários
- ✅ Controle de status ativo/inativo
- ✅ Middleware de autenticação e autorização

## 🚀 Tecnologias Utilizadas

### **Backend**

- **Framework:** AdonisJS v6 (Node.js + TypeScript)
- **Banco de Dados:** PostgreSQL com Lucid ORM
- **Autenticação:** Session-based com middleware
- **Validação:** Vine.js para validação robusta
- **Segurança:** CSRF, Shield, sanitização

### **Frontend**

- **Templates:** Edge.js v6.2.1 (template engine do AdonisJS)
- **CSS:** Tailwind CSS 3.0+ com utility-first approach
- **Ícones:** Font Awesome 6 para ícones
- **JavaScript:** Vanilla JS para interatividade e manipulação DOM
- **Build:** Vite 5 para otimização e bundling de assets
- **UI Components:** Design system customizado com Tailwind

### **Infraestrutura**

- **Deploy:** Heroku (production)
- **Database:** PostgreSQL com Heroku Postgres
- **Versionamento:** Git com GitHub
- **CI/CD:** Deploy automático via `git push heroku main`
- **Process:** Web dyno + Release phase para migrations

## 📊 Arquitetura do Banco de Dados

## 🔐 Módulo Fiscal – Configuração rápida

- Variável obrigatória: `FISCAL_ENCRYPTION_KEY` (32 bytes, AES‑256)
- Desenvolvimento: defina no `.env` (veja `.env.example`).
- Heroku: use o script `setup-heroku-env.sh` ou rode:

```bash
heroku config:set FISCAL_ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" -a <SEU_APP>
```

- Uso: a chave protege segredos fiscais (ex.: senha do certificado A1) em banco.
- Escopo: uma chave por ambiente do app (não por restaurante) é o recomendado.

## 📦 Sistema de Reserva de Insumos – Documentação Completa

Um sistema robusto e inteligente para controlar o estoque de ingredientes com reserva automática e deduções sincronizadas com o status dos pedidos.

**Documentação disponível em `.docs/`:**

- **[RESUMO_FINAL_ESTOQUE.md](.docs/RESUMO_FINAL_ESTOQUE.md)** - Resumo executivo com status final do sistema
- **[GUIA_RAPIDO_ESTOQUE.md](.docs/GUIA_RAPIDO_ESTOQUE.md)** - Guia prático para usuários finais
- **[SISTEMA_ESTOQUE_COMPLETO.md](.docs/SISTEMA_ESTOQUE_COMPLETO.md)** - Documentação técnica detalhada
- **[IMPLEMENTACAO_SISTEMA_ESTOQUE.md](.docs/IMPLEMENTACAO_SISTEMA_ESTOQUE.md)** - Detalhes de implementação
- **[RESUMO_EXECUTIVO_ESTOQUE.md](.docs/RESUMO_EXECUTIVO_ESTOQUE.md)** - Visão executiva das features
- **[DIFF_COMPLETO.md](.docs/DIFF_COMPLETO.md)** - Código alterado e arquivo de testes
- **[DEPLOYMENT.md](.docs/DEPLOYMENT.md)** - Procedimentos de deploy em produção

**Características principais:**

- ✅ **Reserva automática** de insumos ao criar um pedido
- ✅ **Dedução sincronizada** ao mudar pedido para status "preparando"
- ✅ **Liberação de reserva** ao cancelar pedido (antes da dedução)
- ✅ **Cálculo inteligente** de quantidade máxima possível com estoque atual
- ✅ **Indicadores visuais** de disponibilidade de produtos no cardápio
- ✅ **Cobertura de testes** com 10 cenários validados

---

O sistema utiliza PostgreSQL com as seguintes tabelas principais:

```sql
-- Multi-tenant e Autenticação
companies              # Empresas (suporte multi-tenant)
users                  # Usuários do sistema
roles                  # Papéis de usuário (Garçom, Gerente, Admin)

-- Almoxarifado (Inventory)
suppliers              # Fornecedores (Supplier)
insumos                # Insumos/produtos de estoque (Insumo)
nfes                   # Notas fiscais eletrônicas (Nfe)
nota_fiscal_items      # Itens das notas fiscais (NotaFiscalItem)

-- Cardápio (Menu)
cardapio_categorias    # Categorias do cardápio (CardapioCategoria)
cardapio_produtos      # Produtos/pratos do cardápio (CardapioProduto)
cardapio_produtos_ingredientes  # Receitas/ingredientes (CardapioProdutoIngrediente)
cardapio_virtuais      # Cardápios virtuais para clientes (CardapioVirtual)

-- Operação (Operations)
comandas               # Mesas/comandas do restaurante (Comanda)
pedidos                # Pedidos dos clientes (Pedido)
pedido_items           # Itens dos pedidos (PedidoItem)

-- Financeiro (Financial)
vendas                 # Registro de vendas (Venda)
venda_items            # Itens das vendas (VendaItem)
caixa_registros        # Controle de caixa (CaixaRegistro)
```

### Relacionamentos Principais

- `Comanda` → `Pedido` (1:N) - Uma comanda pode ter vários pedidos
- `Pedido` → `PedidoItem` (1:N) - Um pedido tem vários itens
- `CardapioProduto` → `CardapioProdutoIngrediente` (1:N) - Um produto tem vários ingredientes
- `Pedido` → `Venda` (1:1) - Um pedido gera uma venda quando pago
- `User` → `Role` (N:1) - Cada usuário tem um papel

## 🛠️ Instalação e Configuração

### **Pré-requisitos**

- Node.js v18+
- PostgreSQL 13+
- npm ou yarn
- Git

### **📋 Instalação Local**

1. **Clone o repositório**

   ```bash
   git clone https://github.com/invector-tecnologia/tavolo.git
   cd tavolo
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto:

   ```env
   # Aplicação
   TZ=America/Sao_Paulo
   PORT=3333
   HOST=localhost
   LOG_LEVEL=info
   APP_KEY=your_generated_key_here
   NODE_ENV=development

   # Banco de Dados Local
   DB_CONNECTION=postgres
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   DB_DATABASE=tavolo

   # Sessões
   SESSION_DRIVER=cookie
   ```

4. **Gere a chave da aplicação**

   ```bash
   node ace generate:key
   # Copie a chave gerada e cole no .env como APP_KEY
   ```

5. **Configure o banco PostgreSQL**

   ```bash
   # Criar banco (no psql ou pgAdmin)
   createdb tavolo

   # Ou via SQL:
   # CREATE DATABASE tavolo;
   ```

6. **Execute as migrações**

   ```bash
   node ace migration:run
   ```

7. **Compile os assets**

   ```bash
   npm run build
   # Ou para desenvolvimento:
   npm run dev
   ```

8. **Inicie o servidor**

   ```bash
   # Desenvolvimento (com hot reload):
   npm run dev

   # Produção:
   npm start
   ```

9. **Acesse a aplicação**

   Abra seu navegador em:

   ```text
   http://localhost:3333
   ```

### **🧪 Testes Automatizados**

O sistema conta com **49 casos de teste** cobrindo mesas, comandas e sistema de estoque com insumos:

```bash
# Executar todos os testes
npm test

# Executar testes do sistema de estoque (desacoplados de BD)
node tests/unit/run-insumo-tests.js
```

#### ✨ Características dos Testes

- ✅ **Desacoplados de banco de dados** - Zero acoplamento BD
- ✅ **TDD puro** - Testes definem especificação
- ✅ **Mocks de dados** - Simulação realista sem I/O
- ✅ **XP** - Código limpo, SOLID, refatorável

## Executar testes específicos

npm test tests/functional/mesas.spec.ts
npm test tests/functional/mesas_comandas_integration.spec.ts

## Executar com cobertura

npm test -- --coverage

```text

**Cobertura de Testes:**

- ✅ **MesasController**: 100% (14 testes)
  - CRUD completo, filtros, validações, permissões
- ✅ **Integração Mesas+Comandas**: 100% (15 testes)
  - Relações, cascading, transferências, estatísticas

**Arquivos de Teste:**

- `tests/functional/mesas.spec.ts` - Testes do CRUD de Mesas
- `tests/functional/mesas_comandas_integration.spec.ts` - Testes de integração

Para mais detalhes, consulte [MESAS_COMANDAS.md](MESAS_COMANDAS.md).

### **☁️ Deploy no Heroku**

1. **Crie uma conta no Heroku e instale o CLI**

   ```bash
   # Instalar Heroku CLI
   # https://devcenter.heroku.com/articles/heroku-cli

   heroku login
   ```

1. **Crie a aplicação no Heroku**

   ```bash
   heroku create seu-app-tavolo
   ```

2. **Adicione o addon PostgreSQL**

   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set LOG_LEVEL=info
   heroku config:set SESSION_DRIVER=cookie

   # Gerar APP_KEY localmente e setar
   node ace generate:key
   heroku config:set APP_KEY=sua_chave_gerada
   ```

4. **Configure o processo de build**

   Crie o arquivo `Procfile`:

   ```bash
   web: node build/bin/server.js
   release: node build/ace migration:run --force
   ```

   Adicione ao `package.json`:

   ```json
   {
     "scripts": {
       "heroku-postbuild": "npm run build"
     }
   }
   ```

5. **Deploy da aplicação**

   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Acesse sua aplicação**

   ```bash
   heroku open
   ```

## 👨‍💻 Autor e Contato

**Desenvolvido por:** BRO (Bernardo Rosmaninho)  
**GitHub:** [@invector-tecnologia](https://github.com/invector-tecnologia)  
**Projeto:** [TAVOLO Restaurant Management System](https://github.com/invector-tecnologia/tavolo)  
**Demo:** [https://tavolo-6ed2dfa17af9.herokuapp.com](https://tavolo-6ed2dfa17af9.herokuapp.com)

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes de Contribuição

- Siga os padrões de código TypeScript/AdonisJS
- Escreva mensagens de commit claras e descritivas
- Atualize a documentação quando necessário
- Adicione testes para novas funcionalidades
- Mantenha o código limpo e bem comentado

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📖 Guia de Uso

### **🔐 Primeiro Acesso**

1. **Registro:** Acesse `/register` para criar sua conta
2. **Login:** Faça login em `/login` com suas credenciais
3. **Configuração Inicial:**
   - Configure os dados da sua empresa
   - Cadastre usuários e defina permissões
   - Configure fornecedores e insumos
   - Crie as categorias do cardápio
   - Cadastre os produtos do cardápio
   - Configure as comandas/mesas do restaurante

### **🔄 Fluxo Operacional**

**1. Preparação (Início do Dia):**

- Abrir o caixa em `/financeiro/caixa`
- Verificar estoque em `/almoxarifado/insumos`
- Atualizar disponibilidade do cardápio se necessário

**2. Durante o Atendimento:**

- Marcar mesa como ocupada em `/comandas/mesas`
- Criar pedido em `/comandas/pedidos/create`
- Acompanhar pedidos na cozinha em `/cozinha`
- Atualizar status dos pedidos conforme preparo

**3. Fechamento (Fim do Dia):**

- Fechar comandas pagas
- Registrar vendas
- Fechar o caixa com contagem
- Verificar relatórios em `/financeiro/vendas`

### **📊 Navegação Principal**

O sistema está organizado nos seguintes módulos:

- **Dashboard:** `/` - Página inicial com visão geral
- **Almoxarifado:**
  - `/almoxarifado/fornecedores` - Gestão de fornecedores
  - `/almoxarifado/insumos` - Controle de insumos/estoque
  - `/almoxarifado/notas-fiscais` - Importação e gestão de NFe
- **Cardápio:**
  - `/cardapio/categorias` - Categorias do cardápio
  - `/cardapio/produtos` - Produtos e receitas
- **Comandas e Pedidos:**
  - `/comandas/mesas` - Gestão de mesas/comandas
  - `/comandas/pedidos` - Listagem de pedidos
  - `/comandas/pedidos/create` - Criar novo pedido
  - `/cozinha` - Dashboard da cozinha (Kanban)
- **Financeiro:**
  - `/financeiro/vendas` - Histórico de vendas
  - `/financeiro/caixa` - Controle de caixa
- **Usuários:**
  - `/users` - Gestão de usuários e permissões

### **🎨 Estrutura de Views**

```text
resources/views/
├── comandas/              # Gestão de comandas/mesas
│   ├── index.edge        # Listagem de comandas
│   ├── create.edge       # Criar nova comanda
│   ├── edit.edge         # Editar comanda
│   └── show.edge         # Detalhes da comanda
├── pedidos/              # Gestão de pedidos
│   ├── index.edge        # Listagem de pedidos
│   ├── create.edge       # Criar pedido (carrinho interativo)
│   ├── show.edge         # Detalhes do pedido
│   └── kitchen.edge      # Dashboard da cozinha
├── vendas/               # Gestão de vendas
│   ├── index.edge        # Histórico de vendas
│   ├── create.edge       # Registrar venda
│   └── show.edge         # Detalhes da venda
├── caixa/                # Controle de caixa
│   └── index.edge        # Histórico de aberturas/fechamentos
├── users/                # Gestão de usuários
│   ├── index.edge        # Listagem de usuários
│   ├── create.edge       # Criar usuário
│   └── edit.edge         # Editar usuário
├── almoxarifado/         # Módulo de estoque
│   ├── fornecedores/     # Fornecedores
│   ├── insumos/          # Insumos
│   └── notas_fiscais/    # Notas fiscais
├── cardapio/             # Módulo de cardápio
│   ├── categorias/       # Categorias
│   └── produtos/         # Produtos
└── pages/
    ├── home.edge         # Página inicial
    └── errors/           # Páginas de erro
```

## 🎯 Roadmap

### ✅ Concluído (v6.0.0)

- [x] Sistema de autenticação e autorização
- [x] CRUD completo de Fornecedores
- [x] CRUD completo de Insumos com reserva/deduções sincronizadas
- [x] Importação de NFe via XML
- [x] CRUD completo de Categorias e Produtos do Cardápio
- [x] Gestão de receitas e ingredientes com cálculo de máximo possível
- [x] CRUD completo de Comandas/Mesas com 39 testes TDD
- [x] Sistema de Pedidos com carrinho interativo e controle de estoque
- [x] Dashboard da Cozinha (Kanban) com sincronização de insumos
- [x] Testes desacoplados de BD com XP/TDD (49 testes)
- [x] **Sistema de Reserva de Insumos** - Novo em v6.0.0 ✨
  - Reserva automática ao criar pedidos
  - Dedução sincronizada ao entrar em preparo
  - Liberação ao cancelar antes da dedução
  - Indicadores de máximo possível
  - 10 cenários de teste cobertos
- [x] Registro e controle de Vendas
- [x] Controle de Caixa (abertura/fechamento)
- [x] Gestão de Usuários e Permissões
- [x] Interface responsiva com Tailwind CSS
- [x] Deploy em produção com PostgreSQL

### 🚀 Próximas Features

- [ ] 📊 Dashboard com gráficos e KPIs
- [ ] 📈 Relatórios avançados (vendas, produtos mais vendidos, etc.)
- [ ] 🔔 Sistema de notificações em tempo real
- [ ] 📱 Aplicativo mobile para garçons (PWA)
- [ ] 🖨️ Impressão de comandas e notas
- [ ] 💳 Integração com gateways de pagamento
- [ ] 🤖 Integração com chatbots para pedidos online
- [ ] 📸 QR Code para cardápio digital
- [ ] 🌐 API REST pública para integrações
- [ ] 📱 Aplicativo para clientes fazerem pedidos
- [ ] 🔍 Busca avançada e filtros em todas as listagens
- [ ] 📊 BI avançado com machine learning para predição de vendas

---

⭐ **Se este projeto te ajudou, considere dar uma estrela no GitHub!**

**Feito com ❤️ por [BRO](https://github.com/invector-tecnologia) para a comunidade gastronômica brasileira**

---

## 🚀 Deploy no Heroku

### One-click Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Manual Deploy

1. **Instale o Heroku CLI e faça login:**

   ```bash
   heroku login
   ```

2. **Crie uma nova aplicação Heroku:**

   ```bash
   heroku create seu-app-tavolo
   ```

3. **Adicione o addon PostgreSQL:**

   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Configure as variáveis de ambiente:**

   ```bash
   # Gere uma chave segura localmente
   node ace generate:key

   # Configure no Heroku
   heroku config:set APP_KEY="sua-chave-gerada-aqui"
   heroku config:set NODE_ENV=production
   heroku config:set HOST=0.0.0.0
   heroku config:set LOG_LEVEL=info
   ```

5. **Crie o arquivo `Procfile` na raiz do projeto:**

   ```text
   web: node build/bin/server.js
   release: node build/ace migration:run --force
   ```

6. **Faça o deploy:**

   ```bash
   git push heroku main
   ```

7. **Acesse sua aplicação:**

   ```bash
   heroku open
   ```

A aplicação irá automaticamente:

- Compilar o código TypeScript
- Executar as migrations do banco de dados
- Iniciar o servidor web

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload
npm run build            # Compila TypeScript para produção

# Produção
npm start                # Inicia servidor de produção

# Testes e Qualidade
npm test                 # Executa testes
npm run lint             # Executa ESLint
npm run format           # Formata código com Prettier

# Database
node ace migration:run   # Executa migrations
node ace migration:rollback  # Reverte última migration
node ace migration:status    # Status das migrations

# Utilities
node ace generate:key    # Gera APP_KEY
node ace list:routes     # Lista todas as rotas
```

## 📂 Estrutura do Projeto

```text
tavolo/
├── app/
│   ├── controllers/         # Controladores HTTP
│   │   ├── comandas_controller.ts
│   │   ├── pedidos_controller.ts
│   │   ├── vendas_controller.ts
│   │   └── ...
│   ├── middleware/          # Middleware HTTP
│   │   ├── auth_middleware.ts
│   │   ├── guest_middleware.ts
│   │   └── silent_auth_middleware.ts
│   ├── models/              # Modelos Lucid ORM
│   │   ├── comanda.ts
│   │   ├── pedido.ts
│   │   ├── venda.ts
│   │   ├── user.ts
│   │   └── ...
│   └── exceptions/          # Exception handlers
├── config/                  # Arquivos de configuração
│   ├── app.ts
│   ├── database.ts
│   ├── auth.ts
│   └── ...
├── database/
│   └── migrations/          # Migrations do banco
├── resources/
│   ├── views/              # Templates Edge.js
│   │   ├── comandas/
│   │   ├── pedidos/
│   │   ├── vendas/
│   │   ├── caixa/
│   │   ├── users/
│   │   ├── almoxarifado/
│   │   └── cardapio/
│   ├── css/                # Estilos CSS
│   └── js/                 # JavaScript frontend
├── start/                  # Arquivos de inicialização
│   ├── routes.ts           # Definição de rotas
│   ├── kernel.ts           # Kernel HTTP
│   └── env.ts              # Validação de variáveis
├── tests/                  # Testes automatizados
├── public/                 # Assets públicos (gerados)
├── bin/                    # Scripts de entrada
│   ├── server.ts           # Servidor HTTP
│   └── console.ts          # Console Ace
├── adonisrc.ts            # Configuração do AdonisJS
├── package.json           # Dependências npm
├── tsconfig.json          # Configuração TypeScript
├── vite.config.ts         # Configuração Vite
└── README.md              # Este arquivo
```
