# Changelog - Sistema Tavolo

## v1380 - 01/03/2026 - Atualização da Landing Page com Novas Funcionalidades

### Alterações (v1380)

- **[LANDING]** Landing expandida de 6 para 9 cards de funcionalidades (grid 3×3):
  - **Pedidos por Voz** (NOVO) — card com badge "NOVO", destaque para IA, Whisper STT e BYOK
  - **Suporte Inteligente** (NOVO) — tickets conversacionais, auto-resolução, sugestão automática
  - **Acessibilidade e Inclusão** (NOVO) — WCAG, leitores de tela, skip links, contraste adaptável
  - **Mesas e Comandas** — atualizado de "Gestão de Comandas" para incluir mapa de mesas e descontos
  - **Emissão Fiscal NFC-e** — separado do antigo "Fiscal e Suporte" com NFC-e/NF-e, contingência, retry, exportação contábil
  - **Gestão de Estoque** — atualizado com reserva automática de insumos e controle de disponibilidade
  - **Controle Financeiro** — atualizado com descontos percentuais por comanda

- **[SEO]** Meta tags atualizadas:
  - Keywords expandidas: pedido por voz IA, mesas e comandas, emissão NFC-e, acessibilidade WCAG, suporte inteligente
  - Open Graph e Twitter Card com descrições atualizadas
  - JSON-LD SoftwareApplication com descrição ampliada

- **[HERO]** Subtítulo atualizado mencionando pedidos por voz com IA, mesas e comandas, suporte inteligente

- **[PREÇOS]** Plano Padrão atualizado com novos itens: Emissão fiscal NFC-e/NF-e, Mesas e comandas, Pedidos por voz com IA

- **[FOOTER]** Copyright atualizado de 2025 para 2026

- **[DOCS]** `docs/SEO_LANDING.md` atualizado com mapeamento completo das seções da landing

## v1379 - 01/03/2026 - Implementação VOICE_ORDERING (Pedidos por Voz)

### Adições (v1379)

- **[VOICE_ORDERING]** Módulo completo de pedidos por voz implementado (backend + frontend)
  - Pipeline: gravação → Whisper STT → GPT-4o-mini NLU → preview → confirmação → execução
  - Fluxo de confirmação obrigatório (usuário revisa antes de executar)
  - Mensagens de erro amigáveis em todas as etapas

- **[MIGRATION]** `1772200004000_create_voice_configs_table.ts`
  - Tabela `voice_configs` com BYOK (API key criptografada AES-256-GCM)
  - Campos: `empresa_id` (FK única), `openai_api_key_encrypted`, `enabled`, `whisper_model`, `llm_model`

- **[MODELS]** `VoiceConfig` + `voice_crypto.ts`
  - Model Lucid com `setApiKey()`, `getApiKey()`, `maskedApiKey`
  - Helper de criptografia AES-256-GCM usando APP_KEY

- **[SERVICES]** 4 serviços de voz:
  - `VoiceTranscriber` — wrapper OpenAI Whisper (STT)
  - `VoiceIntentParser` — NLU com GPT-4o-mini (system prompt com cardápio + comandas ativas)
  - `VoiceActionExecutor` — execução de 8 intents (create_order, add_items, remove_item, update_quantity, close_comanda, cancel_order, query_status, special_instruction)
  - `VoiceOrderingService` — orquestrador com dois estágios: `preview()` e `execute()`

- **[CONTROLLERS]**
  - `VoiceOrderingController` — endpoints `/api/voice/preview`, `/api/voice/confirm`, `/api/voice/status`, view `/voz`
  - `VoiceConfigController` — CRUD `/configuracoes/voz`, teste de API key

- **[ROUTES]** 7 novas rotas dentro do grupo auth:
  - `GET /voz`, `POST /api/voice/preview`, `POST /api/voice/confirm`, `GET /api/voice/status`
  - `GET /configuracoes/voz`, `POST /configuracoes/voz`, `POST /configuracoes/voz/testar`

- **[VIEWS]**
  - `voice/index.edge` — tela de pedidos por voz com gravação, preview de ações, confirmação e resultado
  - `configuracoes/voz.edge` — tela de configuração BYOK com toggle, campo de API key e teste

- **[CONFIG]**
  - `config/voice.ts` — feature flag, modelos, limites de áudio
  - `config/shield.ts` — CSRF exception para `/api/voice/preview` e `/api/voice/confirm`
  - `start/env.ts` — 6 variáveis opcionais `VOICE_*`

- **[UI]** Links no sidebar do dashboard:
  - "Pedido por Voz" na seção Operação (com ícone de microfone)
  - "Config. Voz" na seção Configurações

## v1378 - 01/03/2026 - BYOK (Bring Your Own Key) — VOICE_ORDERING

### Alterações (v1378)

- **[VOICE_ORDERING]** Adotado modelo BYOK: custo da API OpenAI repassado ao dono do restaurante
  - Cada empresa cadastra sua própria API key via tela de integração (`/configuracoes/voz`)
  - API key armazenada em tabela `voice_configs` (criptografada AES-256-GCM com `APP_KEY`)
  - Padrão de referência: `FiscalConfig` + `FiscalConfigController`

- **[PROMPTS]** Atualizados 5 prompts da stack VOICE_ORDERING para modelo BYOK:
  - `01-system-overview.md` — seção "Modelo de custo — BYOK" com tabela de aspectos
  - `02-architecture.md` — "Etapa 0: Resolução da API Key" no diagrama, VoiceConfig + VoiceConfigController na tabela de componentes
  - `03-data-model.md` — entidade `VoiceConfig` (migration, schema, diagrama de relação)
  - `04-runtime-config.md` — removida `OPENAI_API_KEY` de env vars, adicionadas seções BYOK, tela de integração, feature flag dual (servidor + empresa)
  - `09-deployment.md` — checklist atualizado com migration e config por empresa, custos como "por empresa"

## v1377 - 01/03/2026 - Discovery e Stack VOICE_ORDERING (Pedidos por Voz)

### Adições (v1377)

- **[VOICE_ORDERING]** Discovery de tecnologias para módulo de pedidos por voz
  - Captura de áudio: MediaRecorder API (nativo do browser)
  - Speech-to-Text: OpenAI Whisper API (melhor acurácia PT-BR, $0.006/min)
  - NLU: OpenAI GPT-4o-mini (parsing de linguagem natural → JSON estruturado)
  - Custo operacional estimado: ~$6.75/mês para 100 pedidos/dia

- **[PROMPTS]** Criada stack completa `docs/prompt-migration/VOICE_ORDERING/` com 11 prompts
  - `01-system-overview.md` — escopo funcional, tecnologias, alternativas avaliadas
  - `02-architecture.md` — diagrama de fluxo completo (mic → Whisper → GPT → PedidoService)
  - `03-data-model.md` — contratos de dados (request/response/NLU), mapping intent → service
  - `04-runtime-config.md` — variáveis de ambiente, feature flag, config/voice.ts
  - `05-observability.md` — 10 eventos de log, métricas de performance e acurácia
  - `06-routing-and-http.md` — 4 rotas API (/api/voice/*), contratos HTTP, middleware
  - `07-domain-module.md` — 8 intenções de voz, fluxos de processamento, fuzzy matching
  - `08-tests-and-quality.md` — 3 camadas de teste, fixtures, gates de qualidade
  - `09-deployment.md` — checklist de release, rollback via feature flag, custos
  - `10-performance-db.md` — orçamento de latência (≤5s), cache de cardápio, queries
  - `11-performance-diagnostics.md` — árvore de RCA, comandos de diagnóstico, métricas de acurácia

- **[DOCS]** Atualizado `docs/prompt-migration/README.md` com prompt set VOICE_ORDERING
- **[DOCS]** Atualizado `docs/INDEX.md` com referência a `/api/voice/*`
- **[DOCS]** Atualizado `docs/00-Prompt-de-inicio.md` com VOICE_ORDERING nas stacks ativas

## v1376 - 01/03/2026 - SEO Técnico da Landing (SERP + LLM)

### Melhorias (v1376)

- **[SEO]** Implementado pacote técnico para indexação da landing
  - `public/robots.txt` com referência ao sitemap
  - `public/sitemap.xml` com URL canônica da home
  - `public/manifest.webmanifest` para metadados web app
  - `public/llms.txt` para descoberta por agentes/LLMs

- **[SEO]** Landing atualizada com metadados canônicos
  - domínio canônico ajustado para `https://www.tavolo.com.br/`
  - Open Graph/Twitter com URLs absolutas e imagem de compartilhamento dedicada
  - inclusão de `canonical`, `hreflang`, `theme-color` e `manifest`
  - JSON-LD evoluído para `Organization`, `WebSite` e `SoftwareApplication`

- **[ASSETS]** Criadas imagens de compartilhamento social
  - `public/images/tavolo-og-image.png`
  - `public/images/tavolo-twitter-image.png`

- **[WEB]** Injeção global de `manifest` e favicons mantida para páginas com bundle principal
  - atualização em `resources/js/app.js`

## v1375 - 01/03/2026 - Refinamento Fino do Favicon Tavolo

### Melhorias (v1375)

- **[BRANDING]** Refinado o favicon com ajuste de contraste e espessura para melhor legibilidade em 16x16/32x32
  - regenerados `public/favicon.ico`, `public/favicon.png` e `public/apple-touch-icon.png`

- **[WEB]** Adicionado cache-busting dos ícones para atualização imediata no navegador
  - tags de favicon versionadas em `resources/views/pages/home.edge`
  - injeção global em `resources/js/app.js` também passou a usar versão (`?v=20260301b`)

## v1374 - 01/03/2026 - Inclusão do Novo Favicon Tavolo

### Melhorias (v1374)

- **[BRANDING]** Incluído favicon do Tavolo com símbolo `T` e sublinhado azul
  - gerados arquivos em `public/`: `favicon.ico`, `favicon.png`, `apple-touch-icon.png`
  - `favicon.ico` configurado com múltiplos tamanhos para melhor compatibilidade entre navegadores

- **[WEB]** Atualizadas tags de ícone na landing para os novos assets
  - `resources/views/pages/home.edge` agora referencia `favicon.svg`, `favicon.png` (32x32), `favicon.ico` e `apple-touch-icon.png`

- **[WEB]** Aplicação global dos favicons nas páginas do sistema
  - `resources/js/app.js` injeta/normaliza automaticamente tags de favicon no `<head>`
  - cobertura para páginas que carregam o bundle principal (`resources/js/app.js`)
  - fallback universal mantido por `public/favicon.ico`

## v1373 - 01/03/2026 - Ajuste de Espaçamento no Header da Landing

### Melhorias (v1373)

- **[UX]** Padronizado espaçamento entre ações do topo na landing (`Entrar`/`Teste Grátis` e estado logado)
  - link secundário do bloco de ações agora usa o mesmo padrão visual dos itens de menu (`px-3 py-2`)
  - distância percebida entre os elementos ficou consistente com `Funcionalidades`, `Benefícios`, `Preços` e `Contato`
  - refinado bloco responsivo do topo com `gap-4` e tipografia `text-sm` também nos botões de ação

## v1372 - 01/03/2026 - Hardening de Integridade das APIs de Integração

### Melhorias (v1372)

- **[FIX]** Corrigidas quebras de binding em rotas de API
  - `/api/menu/items` agora aponta para `cardapio_produtos_controller.api`
  - adicionada compatibilidade em `comandas_controller` com método `api` (alias de `apiActive`)
  - adicionada compatibilidade em `dashboard_controller` com método `debugCharts` (alias de `getProductAvailability`)

- **[QUALITY]** Auditoria automática de integridade de rotas executada
  - validação de referências `#controllers/<controller>.<method>` em `start/routes.ts`
  - resultado final: `Missing controllers: 0` e `Missing methods: 0`

- **[BUILD]** Build de produção validado após refactor
  - `npm run build` executado com sucesso

## v1371 - 01/03/2026 - Checklist de Smoke Test Visual Pós-Migração Tailwind

### Melhorias (v1371)

- **[DOCS]** Adicionado checklist de smoke test visual em `docs/TESTING.md`
  - rotas críticas para validação manual (`/dashboard`, `/cardapio/produtos`, `/suporte/tickets`, `/reports`, `/admin`)
  - critérios de aceite para layout, cores, ícones e ausência de warning de CDN Tailwind

## v1370 - 01/03/2026 - Limpeza Global de Tailwind Inline

### Melhorias (v1370)

- **[MAINT]** Removidos blocos legados de `tailwind.config` inline das views Edge
  - limpeza aplicada em 77 templates de `resources/views/**/*.edge`
  - padronização para uso exclusivo do Tailwind compilado localmente via Vite/PostCSS

- **[BUILD]** Validado build completo após limpeza em lote
  - `npm run build` executado com sucesso

## v1369 - 01/03/2026 - Tailwind em Build Local no Fluxo de Suporte

### Melhorias (v1369)

- **[BUILD]** Configurado Tailwind CSS local via PostCSS
  - adicionado `tailwindcss`, `postcss` e `autoprefixer` em `devDependencies`
  - criado `tailwind.config.js` com tokens (`industrial`, `accent`, `brand`)
  - criado `postcss.config.js` e habilitado pipeline em `resources/css/app.css`

- **[UX]** Removido uso de `cdn.tailwindcss.com` nas telas de suporte
  - `resources/views/support_tickets/index.edge`
  - `resources/views/support_tickets/create.edge`
  - `resources/views/support_tickets/show.edge`

- **[FIX]** Eliminado aviso de produção do Tailwind CDN no fluxo `/suporte/tickets*`

## v1368 - 01/03/2026 - Alinhamento UX da Tela de Tickets de Suporte

### Melhorias (v1368)

- **[UX]** Página `/suporte/tickets` alinhada ao padrão visual de telas de gestão (referência: cardápio/produtos)
  - header, hierarquia visual e ações padronizadas
  - tabela de tickets com estilos consistentes de status e ações
  - estado vazio em card com CTA de criação
  - inclusão de quick actions para consistência operacional

- **[FIX]** Correção de estrutura HTML na view de listagem de tickets que impactava layout e usabilidade

## v1367 - 01/03/2026 - Padronização UX de Suporte e Relatórios

### Melhorias (v1367)

- **[UX]** Indicador de suporte online restrito ao contexto do usuário
  - indicador exibido apenas em `/suporte/tickets*`
  - removido da área administrativa de tickets (`/admin/support-tickets*`)

- **[UX]** Páginas de suporte do usuário padronizadas com header do sistema
  - `resources/views/support_tickets/index.edge`
  - `resources/views/support_tickets/create.edge`
  - `resources/views/support_tickets/show.edge`

- **[UX]** Página `/reports` simplificada para layout padrão sem sidebar placeholder
  - removido deslocamento lateral (`md:ml-64`) e bloco de sidebar vazio

- **[DOCS]** Atualização de documentação e prompt-migration
  - `docs/SUPORTE_TICKETS_CICLO.md`
  - `docs/GUIA_MANUTENCAO_FINANCEIRO.md`
  - `docs/prompt-migration/SUPORTE/06-routing-and-http.md`
  - `docs/prompt-migration/FINANCEIRO/06-routing-and-http.md`

## v1366 - 01/03/2026 - Landing Comercial Integrada ao Dashboard Admin

### Melhorias (v1366)

- **[FEAT]** Formulário de contato comercial na landing integrado ao backend
  - nova rota pública `POST /contato-comercial`
  - persistência em `suporte_solicitacoes` com `canal: landing` e `categoria: comercial`
  - criação da mensagem inicial no histórico do ticket para acompanhamento administrativo

- **[UX]** Landing revisada para refletir funcionalidades atuais da plataforma
  - destaque de emissão fiscal e suporte integrado na seção de funcionalidades
  - logo alinhado ao padrão visual do dashboard (`Tavolo` + linha inferior)

- **[ADMIN]** Card de suporte no dashboard atualizado para explicitar contatos comerciais
  - título alterado para **Suporte e Contatos Comerciais**

## v1365 - 01/03/2026 - Ajuste de Indicador de Suporte Online

### Melhorias (v1365)

- **[UX]** Revisado indicador de conectividade nas telas de ticket
  - texto contextual alterado para **"Suporte online"** / **"Suporte offline (modo local)"**
  - posicionamento ajustado para topo em `/suporte/tickets*` e `/admin/support-tickets*`
  - melhoria de clareza para evitar ambiguidade com status genérico de sistema

- **[A11Y]** Indicador com semântica acessível
  - `role="status"` e `aria-live="polite"`
  - mensagem textual direta sem dependência de ícones externos

## v1364 - 01/03/2026 - Padronização de Acessibilidade WCAG (Base Global)

### Melhorias (v1364)

- **[A11Y]** Implementada base global de acessibilidade em todas as telas que carregam `resources/js/app.js` e `resources/css/app.css`
  - skip link para conteúdo principal
  - foco visível padronizado (`:focus-visible`)
  - regiões `aria-live` para mensagens dinâmicas
  - normalização de alertas com `role="alert"`/`role="status"`
  - fallback de `aria-label` em campos sem rótulo
  - fallback de `alt` em imagens sem atributo
  - suporte a `prefers-reduced-motion` e `forced-colors`

- **[DOCS]** Criada documentação transversal de acessibilidade
  - `docs/ACESSIBILIDADE_WCAG.md`
  - índice atualizado em `docs/INDEX.md`

## v1363 - 01/03/2026 - Ciclo Completo de Tickets de Suporte

### Novas Features (v1363)

- **[FEAT]** Implementado fluxo completo de ticket para usuário e admin
  - abertura de ticket pelo usuário
  - conversa bidirecional por mensagens
  - cancelamento pelo usuário antes da conclusão
  - sugestão de solução pelo admin
  - confirmação de solução pelo usuário

- **[FEAT]** Auto-resolução por inatividade de resposta do usuário
  - ticket é resolvido automaticamente após 3 mensagens consecutivas do admin sem retorno do usuário

- **[FEAT]** Notificação de respostas do suporte no dashboard do usuário
  - contador de mensagens não lidas
  - alerta com mensagens recentes
  - badge no menu de tickets

- **[FEAT]** Nova estrutura de persistência para ciclo de ticket
  - migration de evolução de `suporte_solicitacoes`
  - nova tabela `suporte_mensagens`
  - serviço central de regras: `app/services/support_ticket_service.ts`

## v1362 - 01/03/2026 - Dashboard Admin de Assinaturas e Suporte

### Novas Features (v1362)

- **[FEAT]** Dashboard admin expandido para monitorar assinatura, crescimento e suporte
  - KPIs de assinatura: ativas, vencendo (7 dias) e inadimplentes
  - KPI de crescimento: novas empresas nos últimos 30 dias
  - KPIs de suporte: solicitações abertas e urgentes
  - Listas operacionais de empresas recentes, assinaturas em atenção e suporte recente

- **[FEAT]** Novo domínio de assinaturas de empresas
  - Migration: `1772200000000_create_assinaturas_empresas_table.ts`
  - Model: `app/models/assinatura_empresa.ts`

- **[FEAT]** Novo domínio de solicitações de suporte
  - Migration: `1772200001000_create_suporte_solicitacoes_table.ts`
  - Model: `app/models/suporte_solicitacao.ts`

- **[FEAT]** Integração dos novos domínios ao CRUD genérico do admin
  - Modelos adicionados em listagem/criação/edição/exibição/exclusão
  - Busca e preload por empresa para visão operacional

## v1361 - 11/02/2026 - Fallback SOAP 1.1

### Correções (v1361)

- **[FIX]** Retry automatico em SOAP 1.1 quando SOAP 1.2 retorna HTTP 400/415
  - Autorizacao e consulta de protocolo
  - SOAP 1.1 usa `text/xml` e header `SOAPAction` com aspas
  - Retry adicional com `SOAPAction` sem aspas
  - Se ainda falhar, tenta SOAP 1.1 sem SOAP Header

## v1360 - 10/02/2026 - SOAP 1.2 Content-Type

### Correções (v1360)

- **[FIX]** Removido parametro `action` do `Content-Type` em SOAP 1.2
  - Mantem `application/soap+xml; charset=utf-8`
  - Evita HTTP 400 "Bad Request" no SVRS

## v1359 - 10/02/2026 - SOAP 1.2 Header Fix

### Correções (v1359)

- **[FIX]** Removido header `SOAPAction` nas chamadas SOAP 1.2
  - Evita HTTP 400 "Bad Request" no `NFeAutorizacao4`
  - A acao permanece no `Content-Type` como esperado pelo SOAP 1.2

## v1358 - 10/02/2026 - Timeout XSD e Fallback

### Correções (v1358)

- **[FIX]** Validação XSD agora tem timeout para evitar travas indefinidas
  - Timeout padrão: 5000ms (configurável via `FISCAL_SEFAZ_XSD_TIMEOUT_MS`)
  - Timeout é tratado como falha de infraestrutura e a emissão segue
- **[FIX]** Erros de timeout XSD entram no fallback de infraestrutura

## v1356 - 10/02/2026 - Debug Transmissão Fiscal

### Correções (v1356)

- **[FIX]** Adicionado logging detalhado para diagnosticar notas PENDING sem protocolo
  - Logs antes/depois de `signAndValidateXml()`, `authorizeWithTimeout()`, `markAsAuthorized()`
  - Stack traces completos em exceptions
  - Logs de parse da resposta SEFAZ com validação de presença de protocolo
  - Aumentado timeout padrão de 30s → 60s
- **[FIX]** Problema identificado: transmissão SEFAZ bem-sucedida mas resultado não gravado no banco
  - SEFAZ recebeu nota 17 em 2026-02-10T20:20:54
  - Banco não tem registro dessa transmissão
  - Próxima tentativa gera cStat 613 (chave divergente) por usar novo cNF
- **[DOCS]** Criada documentação [FISCAL_TRANSMISSION_DEBUG.md](FISCAL_TRANSMISSION_DEBUG.md)

## v1354 - 10/02/2026 - Reuso de XML em Retentativas

### Correções (v1354)

- **[FIX]** Implementado reuso de XML e chave de acesso em retentativas de emissão
  - Busca nota PENDING/ERROR existente antes de gerar novo XML
  - Reutiliza `xml_content`, `access_key` e `numero` da tentativa anterior
  - Impede geração de novas chaves (cNF divergentes) ao reemitir mesma venda
- **[FIX]** Adicionada validação obrigatória de `access_key` em `createPendingNote()`
  - Lança exception se não conseguir extrair chave do XML
  - Logs detalhados de `access_key` e `numero` ao criar nota
- **[MAINT]** Limpeza de 48 notas órfãs (PENDING/ERROR sem access_key ou protocolo)

## v1349 - 10/02/2026 - Correção Endpoints SEFAZ

### Correções (v1349)

- **[FIX]** Corrigidos endpoints `consultaProtocolo` para SVRS (RS e outros estados)
  - Caminho correto: `/ws/NfeConsulta/NfeConsulta4.asmx`
  - Caminho anterior (incorreto): `/ws/NfeConsultaProtocolo/NFeConsultaProtocolo4.asmx`
  - Aplicado em: SVRS_HOMOLOGACAO, SVRS_PRODUCAO, SEFAZ_PROPRIA_HOMOLOGACAO['RS']
  - Resolve falhas SSL/TLS em consultas de protocolo

## v503 - 08/12/2025 - Bug Fix

### Correções

- **[FIX]** Corrigida sintaxe Edge na view `resources/views/mesas/index.edge`
  - Problema: `@else` sem `@if` correspondente causava erro 500
  - Solução: Adicionado `@if(mesas.data.length > 0)` ao redor do loop `@each`
  - Erro anterior: "Missing catch or finally after try"

## v502 - 08/12/2025 - Menu de Navegação

### Melhorias

- **[FEAT]** Adicionado link "Mesas" no menu de navegação principal
  - Local: `resources/views/dashboard/index.edge`
  - Posição: Seção "Comandas", antes de "Comandas" (agora são 4 itens)
  - Rota: `/mesas` (route: mesas.index)
  - Estrutura final do menu:

    ```text
    Comandas (seção)
    ├── Mesas (NOVO)
    ├── Comandas
    ├── Pedidos
    └── Cozinha
    ```

## v501 - 08/12/2025 - Views de Mesas e Comandas

### Novas Features - Views

- **[FEAT]** Criadas 4 views completas de Mesas:
  - `resources/views/mesas/index.edge`: Listagem com filtros, tabela responsiva, contador de comandas
  - `resources/views/mesas/create.edge`: Formulário de criação
  - `resources/views/mesas/edit.edge`: Formulário de edição
  - `resources/views/mesas/show.edge`: Detalhes com estatísticas e comandas vinculadas

- **[FEAT]** Atualizadas 3 views de Comandas para integração com Mesas:
  - `resources/views/comandas/index.edge`: Adicionado filtro por mesa (5 colunas)
  - `resources/views/comandas/create.edge`: Select opcional de mesa
  - `resources/views/comandas/edit.edge`: Select opcional de mesa (preenchido)

### Detalhes Técnicos

- **index.edge**:
  - Filtros: busca (número/nome), localização, apenas ativas
  - Contador de comandas usando `$extras.comandas_count`
  - Badge de status (ativa/inativa) com ícones Font Awesome
  - Ações por permissão: ver (all), editar (update), toggle (update), excluir (delete)
  - Paginação completa com range de páginas

- **show.edge**:
  - 3 cards de estatísticas: Total Comandas, Comandas Ativas, Status Ocupação
  - Tabela de comandas vinculadas com: número, nome, data abertura, status, total
  - Link direto para visualizar cada comanda

- **Comandas com Mesas**:
  - Select opcional: "Sem mesa" ou lista de mesas ativas
  - Filtro: "Todas" ou mesas específicas
  - Exibição: "Mesa X - Nome" quando vinculada

## v500 - 08/12/2025 - Backend de Mesas e Comandas

### Novas Features - Backend

- **[FEAT]** Implementação completa do backend de Mesas:
  - Model: `app/models/mesa.ts`
  - Controller: `app/controllers/mesas_controller.ts` (287 linhas)
  - 9 rotas novas em `start/routes.ts`

- **[FEAT]** Integração de Mesas com Comandas:
  - Model Comanda atualizado com relação opcional Mesa
  - Controller Comandas atualizado: preload, filtros, selects

### Estrutura de Banco de Dados

#### Migration 1: `1733691100000_create_mesas_table.ts` (Batch 27)

```sql
CREATE TABLE mesas (
  id                SERIAL PRIMARY KEY,
  empresa_id        INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  number            VARCHAR(20) NOT NULL,
  name              VARCHAR(100) NULL,
  location          VARCHAR(100) NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP,
  UNIQUE (empresa_id, number)
);
CREATE INDEX idx_mesas_empresa_id ON mesas(empresa_id);
```

#### Migration 2: `1733691200000_add_mesa_id_to_comandas.ts` (Batch 27)

```sql
ALTER TABLE comandas 
  ADD COLUMN mesa_id INTEGER NULL,
  ADD FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL;
CREATE INDEX idx_comandas_mesa_id ON comandas(mesa_id);
```

#### Migration 3: `1733691300000_add_mesas_permissions_to_roles.ts` (Batch 28)

```typescript
// Permissões por Role:
Super Admin / Administrador: ['create', 'read', 'update', 'delete']
Gerente:                     ['create', 'read', 'update']
Garçom / Atendente:          ['read']
```

### Models

#### Mesa (`app/models/mesa.ts`)

```typescript
Campos:
- id: number
- empresaId: number
- number: string
- name: string | null
- location: string | null
- active: boolean
- sortOrder: number

Relações:
- belongsTo Empresa
- hasMany Comandas

Métodos:
- getActiveComandas(): Promise<Comanda[]>
- getComandaCount(): Promise<number>
```

#### Comanda (atualizado)

```typescript
Novos Campos:
- mesaId: number | null

Novas Relações:
- belongsTo Mesa (opcional)
```

### Controllers

#### MesasController (`app/controllers/mesas_controller.ts`)

```typescript
index():
  - Listagem com withCount('comandas')
  - Filtros: search (number/name), location, active_only
  - Paginação: 20 por página
  - Ordenação: sort_order ASC, number ASC

create():
  - View de formulário

store():
  - Validação: number obrigatório (max 20), name opcional, location opcional
  - Check: número único por empresa
  - Criação com sort_order automático

show(id):
  - Detalhes da mesa
  - Preload de comandas vinculadas
  - Estatísticas: total comandas, comandas ativas, status

edit(id):
  - Formulário preenchido

update(id):
  - Validação igual ao store
  - Check único (exceto própria mesa)
  - Atualização com preserve de sort_order

destroy(id):
  - Check: não pode excluir se há comandas vinculadas
  - Soft delete (mesa.active = false) se houver comandas
  - Hard delete se não houver comandas

toggleActive(id):
  - Alternar status active
  - Redirect back com mensagem de sucesso
```

#### ComandasController (atualizado)

```typescript
Mudanças:
- Preload automático de Mesa em index/show
- Filtro por mesa_id em index
- Buscar mesas ativas para selects em create/edit/index
- Validação com mesaId opcional
- Create/Update com mesa_id null ou valor
```

### Rotas (`start/routes.ts`)

```typescript
Novas Rotas de Mesas:
GET    /mesas              -> mesas.index
GET    /mesas/nova         -> mesas.create
POST   /mesas              -> mesas.store
GET    /mesas/:id          -> mesas.show
GET    /mesas/:id/editar   -> mesas.edit
PUT    /mesas/:id          -> mesas.update
POST   /mesas/:id          -> mesas.update (form compatibility)
DELETE /mesas/:id          -> mesas.destroy
POST   /mesas/:id/toggle   -> mesas.toggleActive

Todas protegidas por:
- Middleware auth
- Check de verificação de email
- Permissões @can('action', 'mesas')
```

### Arquitetura

#### Conceito: Comandas Independentes, Mesas Opcionais

- **Antes**: Mesa obrigatória → Comanda pertence a mesa
- **Depois**: Comanda independente → Mesa é agrupamento opcional

#### Exemplos de Uso

```text
✅ Comanda sem mesa (delivery, balcão):
   - Comanda 0001 (sem mesa)
   - Comanda 0002 (sem mesa)

✅ Comanda com mesa (salão):
   - Mesa 5 (Varanda)
     ├── Comanda 0003
     ├── Comanda 0017
     └── Comanda 0025

✅ Transferir comanda entre mesas:
   - Editar comanda
   - Alterar select de mesa
   - Salvar
```

### Validações Implementadas

1. ✅ Número de mesa único por empresa
2. ✅ Não permite excluir mesa com comandas vinculadas
3. ✅ Mesa pode ser desativada a qualquer momento
4. ✅ Comanda pode existir sem mesa (mesa_id = NULL)
5. ✅ Comanda pode ser vinculada/desvinculada de mesa
6. ✅ ON DELETE SET NULL: se mesa excluída, comandas viram independentes

### Permissões e Autorização

```typescript
@can('create', 'mesas')  -> Botão "Nova Mesa"
@can('read', 'mesas')    -> Ver detalhes
@can('update', 'mesas')  -> Editar, Toggle Active
@can('delete', 'mesas')  -> Excluir
```

## Notas de Desenvolvimento

### Problemas Resolvidos

1. **Migration de permissões com JSON parse**
   - Erro: `"[object Object]" is not valid JSON`
   - Solução: Parse condicional baseado em typeof

2. **Sintaxe Edge com @else**
   - Erro: "Missing catch or finally after try"
   - Solução: Adicionar @if ao redor do @each

### Pendências Conhecidas

1. **Envio de emails de verificação**
   - Status: Logs mostram "✅ Email enviado com sucesso!" mas emails não chegam
   - Possível causa: Configuração SMTP Zoho, template Edge, ou DNS/SPF
   - Investigação necessária

### Melhorias Futuras Sugeridas

1. Dashboard com métricas de mesas
2. Grid view tipo "planta do restaurante"
3. Transferência de comandas entre mesas (já parcialmente implementado via edit)
4. Juntar/dividir comandas
5. Sistema de reservas de mesas
6. Relatórios de ocupação e faturamento por mesa
7. Status visual em tempo real (websockets)

## Testes Recomendados

### Casos Básicos

- [x] Criar mesa sem comandas
- [x] Criar comanda sem mesa
- [x] Vincular comanda a mesa
- [x] Desvincular comanda de mesa (editar e remover mesa)
- [ ] Excluir mesa vazia
- [ ] Tentar excluir mesa com comandas (deve falhar/desativar)
- [x] Filtrar comandas por mesa
- [x] Buscar mesas por número/nome
- [x] Ativar/desativar mesa
- [x] Validar número único de mesa por empresa

### Permissões

- [ ] Super Admin: todas operações
- [ ] Gerente: criar, ler, atualizar (não excluir)
- [ ] Garçom: apenas leitura

## Deploy Information

- **Versão Atual**: v503
- **Data**: 08/12/2025
- **Plataforma**: Heroku
- **URL**: <https://www.tavolo.com.br>
- **Banco**: PostgreSQL (Heroku Postgres)
- **Migrations**: Up to date (batch 28)
- **Status**: ✅ Funcionando

## Estatísticas

- **Files Changed**: 12 arquivos
- **Lines Added**: ~800 linhas
- **Commits**: 5 commits (v500, v501, v502, v503)
- **Migrations Executed**: 3 (batch 27 e 28)
- **Routes Added**: 9 rotas
- **Views Created**: 4 views (+ 3 atualizadas)
- **Models**: 2 (1 novo Mesa, 1 atualizado Comanda)
- **Controllers**: 2 (1 novo MesasController, 1 atualizado ComandasController)

---
Desenvolvido por: Bernardo Rosmaninho
Data: 08/12/2025
Sistema: Tavolo - Gestão de Restaurantes
