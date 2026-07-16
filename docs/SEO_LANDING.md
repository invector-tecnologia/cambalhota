# SEO da Landing (SERP + LLM)

Este documento descreve os artefatos e práticas aplicados para melhorar descoberta e interpretação da landing do Tavolo por motores de busca e agentes de IA.

## URL canônica

- Landing principal: `https://www.tavolo.com.br/`

## Arquivos públicos de descoberta

- `public/robots.txt`
- `public/sitemap.xml`
- `public/manifest.webmanifest`
- `public/llms.txt`

## Metadados da landing

Arquivo: `resources/views/pages/home.edge`

Implementado:

- `canonical` e `hreflang` (`pt-BR`)
- Open Graph com domínio canônico e imagem absoluta
- Twitter Card com imagem absoluta
- `theme-color` e `application-name`
- JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`)
- Keywords incluem: pedido por voz IA, mesas e comandas, emissão NFC-e, acessibilidade WCAG, suporte inteligente

## Seções da landing page

A landing (`home.edge`) possui as seguintes seções:

1. **Header** — logos, navegação (Funcionalidades, Benefícios, Preços, Contato), botões Entrar/Dashboard
2. **Hero** — título principal, subtítulo com destaque para pedidos por voz com IA, CTA "Começar Agora - Grátis", SVG animado
3. **Funcionalidades** — 9 cards (grid 3×3):
   - Gestão de Estoque (com reserva automática de insumos)
   - Cardápio Digital
   - Mesas e Comandas (com mapa em tempo real e descontos)
   - Controle Financeiro (com descontos por comanda)
   - Relatórios Inteligentes
   - Emissão Fiscal NFC-e (NFC-e/NF-e, contingência offline, reprocessamento)
   - **Pedidos por Voz** (NOVO — IA, Whisper STT, BYOK)
   - **Suporte Inteligente** (tickets conversacionais, auto-resolução)
   - **Acessibilidade e Inclusão** (WCAG, leitores de tela, skip links)
4. **Benefícios** — 4 KPIs: Produtividade +40%, Desperdícios -25%, Controle +60%, Integrado 100%
5. **Preços** — 2 planos: Padrão R$147/mês (com NFC-e, mesas, voz, relatórios, API) e Personalizado (sob consulta)
6. **CTA** — call-to-action principal
7. **Footer** — links, formulário de contato comercial, dados de contato, copyright © 2026

## Imagens sociais (Open Graph/Twitter)

- `public/images/tavolo-og-image.png`
- `public/images/tavolo-twitter-image.png`

## Cobertura global de ícones/manifests

Arquivo: `resources/js/app.js`

- Injeção automática de favicon (`svg/png/ico`, `apple-touch-icon`) e `manifest` no `<head>`
  para páginas que carregam o bundle principal.
- Páginas sem bundle principal seguem com fallback do navegador via `public/favicon.ico`.

## Validação recomendada

1. Executar build: `npm run build`
2. Validar `robots.txt`: `https://www.tavolo.com.br/robots.txt`
3. Validar `sitemap.xml`: `https://www.tavolo.com.br/sitemap.xml`
4. Testar compartilhamento social (Open Graph/Twitter) em ambiente público.
5. Solicitar indexação no Google Search Console após deploy.

## Observações importantes

- SEO é cumulativo: esses ajustes melhoram a base técnica, mas ranking final depende também de conteúdo, autoridade de domínio, performance e sinais externos.
- Para LLMs, `llms.txt` ajuda descoberta, porém cada agente adota políticas próprias de crawling e priorização.
