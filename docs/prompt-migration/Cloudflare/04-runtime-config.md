# Prompt - Configuração de Runtime e Settings (Cloudflare)

Role: Você é um engenheiro de plataforma.
Objetivo: Identificar knobs de configuração de runtime nos produtos Cloudflare.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Configuracoes estao distribuidas por produto (DNS, SSL/TLS, Cache, WAF, Workers).
- Rules engines e bindings são centrais para o comportamento.

Fontes primárias

- <https://developers.cloudflare.com/dns/>
- <https://developers.cloudflare.com/ssl/>
- <https://developers.cloudflare.com/cache/>
- <https://developers.cloudflare.com/waf/>
- <https://developers.cloudflare.com/workers/>

Pedido

1) Liste categorias de configuração e efeitos (DNS records, SSL modes, cache rules, WAF rules).
2) Identifique settings de runtime do Workers (bindings, triggers, placement).
3) Note limites de plano ou disponibilidade de features quando relevante.
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Cite docs oficiais.
- Marque desconhecidos e liste como verificar.
