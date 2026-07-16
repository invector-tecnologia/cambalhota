# Escopo Estratégico do Projeto (PRD) - Tavolo Restaurant ERP

Este documento estabelece as diretrizes fundamentais de negócios, as fronteiras de atuação e as fundações tecnológicas do Tavolo. Ele atua como o contrato principal entre as áreas de Produto, Liderança Técnica e Engenharia.

## 1. Proposta de Valor e Priorização (Matriz MoSCoW)
O Tavolo é o ERP de nova geração para Food Service (restaurantes, bares, lanchonetes), oferecendo operação ultra-rápida, contingência offline fiscal (NFC-e), Inteligência Artificial para pedidos por voz e UX fluida inspirada nas melhores práticas mundiais.

*   **1.1. Requisitos Críticos (Must-Have):** 
    *   Gestão de Mesas e Comandas com múltiplos status (livre, ocupada, aguardando conta, etc.).
    *   Frente de Caixa (PDV) ultra-rápido para fechamento de contas e múltiplas formas de pagamento (PIX, Cartão, Dinheiro).
    *   Emissão Fiscal (NFC-e) em tempo real, com contingência offline automática.
    *   Cardápio Digital configurável com categorias, produtos e adicionais/observações.
    *   Multi-tenancy nativo (múltiplas empresas/CNPJs isolados na mesma base).

*   **1.2. Requisitos Estratégicos (Should-Have):** 
    *   Gestão de Almoxarifado e Estoque (fichas técnicas, baixa automática no preparo).
    *   Monitor de Preparo na Cozinha (KDS - Kitchen Display System).
    *   Assistente de Pedidos por Voz (Integração Whisper + GPT-4o-mini) para garçons.
    *   Importação de Notas Fiscais de Fornecedores via XML.

*   **1.3. Requisitos de Aprimoramento (Nice-to-Have):** 
    *   Programa de fidelidade (Cashback).
    *   Autoatendimento via QR Code na mesa (Cardápio interativo e pagamento pelo celular).
    *   Análises avançadas de rentabilidade (BI integrado).

## 2. Domínio de Usuários (Atores e Público-Alvo)

*   **Garçom (App Mobile/Tablet):** Necessita de agilidade absurda. Clica pouco, usa comandos de voz e precisa saber quais mesas estão precisando de atenção.
*   **Caixa / Operador de PDV:** Necessita de segurança, atalhos de teclado e resiliência offline para que a fila nunca pare, mesmo sem internet.
*   **Cozinheiro / KDS:** Tela simplificada de alto contraste (dark mode), toques rápidos para mudar status dos pedidos.
*   **Gerente / Proprietário:** Acesso a dashboards em tempo real, controle de estoque (CMV), DRE gerencial e configurações do negócio.
*   **Superadmin (Tavolo):** Gestão global de assinaturas (SaaS), suporte a tickets e monitoramento da infraestrutura.

## 3. Topologia de Funcionalidades Core

1. **Operação e Atendimento (Core 1)**: PDV, Mesas, Comandas, KDS, Voz.
2. **Backoffice Financeiro (Core 2)**: Contas a pagar/receber, fechamento de caixa, meios de pagamento.
3. **Engenharia de Cardápio (Core 3)**: Produtos, categorias, precificação, ficha técnica (insumos).
4. **Motor Fiscal (Core 4)**: Integração SEFAZ multi-UF, assinatura A1, mensageria NFC-e/NF-e.

## 4. Fronteiras e Proteção de Escopo (Out of Scope)

*   **4.1. Restrições Absolutas (Forbidden):** 
    *   O sistema NÃO será um marketplace de delivery (como o iFood). Iremos integrar com marketplaces, mas não gerir motoboys ou ter um app B2C global.
    *   O sistema NÃO irá gerenciar folha de pagamento de funcionários (contabilidade complexa).
*   **4.2. Anti-padrões e Riscos a Evitar (Avoid):** 
    *   Evitar dependência de hardwares proprietários. O sistema deve rodar no navegador, tablets comuns e máquinas POS baseadas em Android/Windows.
    *   Não construir gateways de pagamento do zero (utilizar adquirentes existentes como Stone/Mercado Pago).

## 5. Diretrizes de Interface e Experiência (UX/UI)

*   **5.1. Padrões Visuais (Design System):** Interface deve ser predominantemente *Dark Mode* para ambientes de bar/restaurante com baixa iluminação, usando `Tailwind CSS`. Botões grandes, foco em touch, micro-interações via `Alpine.js`.
*   **5.2. Benchmarks:** Toast POS, Square for Restaurants, Goomer, iFood Gestão.
*   **5.3. Acessibilidade (WCAG):** Alto contraste, legibilidade sob forte luz e suporte a navegação por teclado para caixas.

## 6. Fundações Tecnológicas (Stack Baseline)

*   **6.1. Camada de Apresentação:** Edge.js (SSR HTML), Tailwind CSS, Alpine.js.
*   **6.2. Camada de Negócios:** AdonisJS v6, TypeScript, Vine.js (Validação), Japa (Testes). Arquitetura MVC.
*   **6.3. Camada de Persistência:** PostgreSQL, acessado estritamente via Lucid ORM. Variável `DATABASE_SCHEMA` obrigatória. (Proibido uso do schema 'public'). Isolamento via `empresa_id`.
*   **6.4. Infraestrutura:** Heroku (Web Dynos), Heroku Postgres, Cloudflare R2 (Imagens e Certificados), Certificados A1 assinados nativamente via lib criptográfica do Node.js.
