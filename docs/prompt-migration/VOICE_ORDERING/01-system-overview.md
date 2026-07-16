# Prompt - Visão Geral do Sistema

Role: Você está atuando como analista técnico da stack VOICE_ORDERING.
Objetivo: Construir um panorama do módulo de pedidos por voz — escopo, tecnologias e responsabilidades.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

O módulo VOICE_ORDERING permite que o operador do Tavolo (garçom, caixa ou gerente) dite pedidos e ações de comanda por voz.
O sistema captura o áudio, transcreve e interpreta em ações estruturadas que alimentam os endpoints existentes de pedidos e comandas.

- Fontes prioritárias:
  - `app/controllers/pedidos_controller.ts` — CRUD de pedidos (store, update, confirm, cancel)
  - `app/services/pedido_service.ts` — `createPedido`, `updatePedido`
  - `app/controllers/comandas_controller.ts` — CRUD de comandas (store, close, reopen)
  - `app/models/pedido.ts`, `app/models/pedido_item.ts`, `app/models/comanda.ts`
  - `app/models/cardapio_produto.ts`, `app/models/cardapio_categoria.ts`
  - `start/routes.ts` — rotas protegidas de pedidos e comandas
  - `package.json` — dependências atuais (nenhuma de AI/voz)

Escopo funcional

O módulo cobre as seguintes ações por voz:

| Intenção | Exemplo de fala | Ação no sistema |
| :----: | :----: | :----: |
| Criar pedido | "Dois X-Burger sem cebola pra mesa 5" | `PedidoService.createPedido` |
| Adicionar itens | "Mais uma Coca-Cola pro pedido da mesa 3" | `pedido.addItem` |
| Remover item | "Tira a batata frita do pedido" | `PedidoItem.delete` |
| Alterar quantidade | "Troca o guaraná, agora são três" | `PedidoItem.merge({ quantity })` |
| Fechar comanda | "Fecha a comanda da mesa 7" | `ComandaCloseService.close` |
| Consultar status | "Qual o total da mesa 4?" | Leitura de `pedido.total` |
| Cancelar pedido | "Cancela o último pedido" | `pedidos_controller.cancel` |
| Instrução especial | "O hambúrguer é sem glúten" | `specialInstructions` no item |

Tecnologias selecionadas (Discovery)

| Camada              | Tecnologia          | Justificativa                                                 |
|---------------------|---------------------|-----------------------------------------------------------------|
| Captura de áudio    | MediaRecorder API   | Nativo do browser, sem dependência externa                     |
| Speech-to-Text(STT) | OpenAI Whisper API  | Melhor acurácia em PT-BR, API REST simples, custo $0.006/min   |
| Compreensão (NLU)   | OpenAI GPT-4o-mini  | Parsing flexível de linguagem natural → JSON estruturado       |
| Integração backend  | AdonisJS controller | Novo `voice_ordering_controller.ts` com rotas `/api/voice/*`   |
| Frontend            | Alpine.js + Tailwind| Consistente com stack existente do Tavolo                      |

Alternativas avaliadas e descartadas

| Alternativa              | Motivo de descarte                                                    |
|--------------------------|-----------------------------------------------------------------------|
| Web Speech API (browser) | Suporte limitado a Chrome/Edge; acurácia PT-BR inconsistente          |
| Google Cloud STT         | Configuração mais complexa (service account); pricing por chunk       |
| Azure Cognitive          | Vendor lock-in; sem vantagem de acurácia sobre Whisper para PT-BR     |
| Deepgram                 | Streaming bom mas custo maior; PT-BR em beta                         |
| Rasa / Dialogflow (NLU)  | Overkill para parsing de cardápio; requer treinamento contínuo        |
| Regex / patterns (NLU)   | Frágil; não lida com variações naturais de fala                       |

Dependências a adicionar

- `openai` (npm) — SDK oficial para Whisper + GPT-4o-mini
- Nenhuma outra dependência externa necessária

Modelo de custo — BYOK (Bring Your Own Key)

O custo da API OpenAI é repassado ao dono do restaurante. Cada empresa cadastra sua própria API key via tela de integração (`/configuracoes/voz`), seguindo o padrão de `FiscalConfig`.

| Aspecto               | Detalhe                                                      |
|------------------------|--------------------------------------------------------------|
| Responsável pelo custo | Dono do restaurante (empresa)                                |
| Armazenamento da key   | Tabela `voice_configs` (criptografada com AES-256-GCM)       |
| Padrão de referência   | `FiscalConfig` + `FiscalConfigController`                    |
| Tela de configuração   | `/configuracoes/voz` — form com key mascarada + botão testar |
| Feature flag global    | `VOICE_ORDERING_ENABLED` (env var do servidor)               |
| Feature flag empresa   | `VoiceConfig.enabled` (por restaurante)                      |
| Custo estimado         | ~$6.75/mês por empresa (100 pedidos/dia, 30s/pedido)         |

Sem API key configurada, o módulo de voz fica indisponível para a empresa — o widget de microfone não aparece e as rotas `/api/voice/*` retornam 404.

Pedido

1) Mapeie como o áudio flui do microfone até a ação de sistema (pipeline completo).
2) Identifique pontos de falha: timeout de gravação, erro de transcrição, item não encontrado no cardápio, API key ausente ou inválida.
3) Liste invariantes: o operador deve estar autenticado; a empresa deve ter API key configurada; a comanda/mesa deve existir; o item deve estar disponível (integração com `insumo_stock_service`).
4) Se houver ação solicitada, gere plano numerado e verificável.

Formato de saída

- Context Summary (8-12 bullets)
- Source Map (arquivos/URLs usados)
- Open Questions (apenas se houver)
- Action Plan (quando houver ação solicitada)

Restrições

- Não invente detalhes.
- Baseie afirmações em evidências do repositório ou docs oficiais.
- O módulo é uma camada sobre os endpoints existentes — não substitui controllers de pedido/comanda.
- Responda em PT-BR, salvo instrução contrária.
