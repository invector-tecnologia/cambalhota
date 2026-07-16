# Tavolo Features Map

**Status:** 🚀 Ativo
**Objetivo:** Este documento é a única fonte da verdade de produto. Qualquer nova implementação deve ter sua especificação listada aqui.

---

## Domínio 1: Almoxarifado e Estoque
O coração do custo do restaurante. O objetivo é controlar o CMV (Custo da Mercadoria Vendida) sem engessar a operação.

*   **1.1. Gestão de Fornecedores** [Status: ✅ Implementado]
    *   CRUD básico com amarração a CNPJ e Inscrição Estadual.
*   **1.2. Gestão de Insumos** [Status: ✅ Implementado]
    *   Definição de unidades de medida (kg, L, unidade), custo médio, e alertas de estoque mínimo.
*   **1.3. Entrada de Notas (XML)** [Status: 🚧 Planejado]
    *   Importação do XML da NF-e do fornecedor para alimentação automática do estoque e do financeiro (Contas a Pagar).
*   **1.4. Ficha Técnica e Baixa Automática** [Status: 🚧 Em Desenvolvimento]
    *   Amarração entre o Insumo e o Produto de Venda (ex: "Hambúrguer" baixa "Pão", "Carne 150g", "Queijo").

## Domínio 2: Engenharia de Cardápio
A vitrine do restaurante. Deve ser flexível para lidar com combos, meios a meios, adicionais e observações.

*   **2.1. Categorias e Subcategorias** [Status: ✅ Implementado]
    *   Para organização no PDV e Cardápio Digital (ex: Bebidas -> Cervejas).
*   **2.2. Produtos Simples e Compostos** [Status: ✅ Implementado]
    *   Gestão de preço, foto, descrição e regra de comissão/serviço.
*   **2.3. Modificadores (Adicionais e Opcionais)** [Status: 🚧 Planejado]
    *   Exemplo: "Sem cebola", "Ponto da carne", "Adicional de Bacon".
*   **2.4. Cardápio Digital QR Code** [Status: ✅ Implementado]
    *   Página de exibição do cardápio formatada para celular do cliente na mesa.

## Domínio 3: Operação de Salão e KDS
Velocidade é a prioridade. A comunicação entre salão e cozinha não pode falhar.

*   **3.1. Mapa de Mesas e Comandas Individuais** [Status: ✅ Implementado]
    *   Controle de agrupamento (pessoas na mesma mesa), transferências de produtos e encerramento.
*   **3.2. Lifecycle do Pedido (KDS)** [Status: 🚧 Em Desenvolvimento]
    *   Fluxo: `Registrado -> Na Cozinha -> Pronto -> Entregue`. Painel touch (dark mode) para a cozinha.
*   **3.3. IA Voice Ordering** [Status: ✅ Implementado]
    *   Captura de áudio do garçom ("Mesa 12, duas cocas e um filé ao ponto"), processado por Whisper e GPT-4o-mini para gerar itens na comanda.

## Domínio 4: Financeiro e Frente de Caixa (PDV)
Fechamento de caixa robusto e conciliação fácil.

*   **4.1. Operação de Caixa** [Status: ✅ Implementado]
    *   Abertura (fundo de troco), Sangria, Suprimento e Fechamento.
*   **4.2. Pagamentos Múltiplos** [Status: ✅ Implementado]
    *   Divisão de conta (ex: R$ 50 no PIX, R$ 20 no Dinheiro, e resto no Cartão de Crédito).
*   **4.3. Taxa de Serviço e Descontos** [Status: ✅ Implementado]
    *   Acréscimo opcional de 10%/13% e lançamento de cortesias/descontos sob alçada de gerente.

## Domínio 5: Motor Fiscal (NFC-e / NF-e)
Legalidade sem dor de cabeça. Se a internet cair, a nota deve emitir offline (Contingência).

*   **5.1. Configuração Fiscal da Empresa** [Status: ✅ Implementado]
    *   Upload do Certificado A1 (.pfx) com armazenamento seguro (Cloudflare R2 ou criptografia em DB), e CFOPs/CSOSNs padrão.
*   **5.2. Emissão de NFC-e** [Status: ✅ Implementado]
    *   Comunicação Síncrona com a SEFAZ. Assinatura do XML e geração do QR Code.
*   **5.3. Emissão em Contingência Offline** [Status: 🚧 Em Desenvolvimento]
    *   Impressão imediata para o consumidor via modo offline, sincronizando quando houver internet.

## Domínio 6: Plataforma e Administração (SaaS)
Base do negócio Tavolo como empresa (Multi-tenant).

*   **6.1. Tenant Isolation** [Status: ✅ Implementado]
    *   Todo registro (menos tabelas master) possui `empresa_id` indexado.
*   **6.2. Autenticação e RBAC** [Status: ✅ Implementado]
    *   Login seguro, papéis (garçom não pode estornar, apenas gerente e admin).
*   **6.3. Relatórios Gerenciais (BI)** [Status: 🚧 Planejado]
    *   Curva ABC de produtos, CMV, DRE gerencial, Ticket Médio e Movimento por hora.
