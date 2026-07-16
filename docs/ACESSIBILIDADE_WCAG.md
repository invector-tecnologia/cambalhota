# Acessibilidade WCAG - Diretrizes Transversais

Este documento consolida as regras mínimas de acessibilidade aplicadas no Tavolo para telas web (UI e fluxos administrativos).

## Objetivo

- Garantir navegação por teclado em fluxos críticos.
- Melhorar legibilidade e previsibilidade entre temas/layouts.
- Padronizar feedback de estado e alertas para leitores de tela.

## Implementação Global (base atual)

- **Skip link para conteúdo principal** em páginas com `main`.
- **Foco visível** padronizado via `:focus-visible`.
- **Regiões live (`aria-live`)** para mensagens dinâmicas.
- **Semântica de alertas/status** para blocos de feedback visível.
- **Redução de movimento** com `prefers-reduced-motion`.
- **Compatibilidade forced-colors** para alto contraste do sistema.
- **Fallback de acessibilidade em formulários** (`aria-label` quando ausente).
- **Fallback de `alt` em imagens** quando não informado.

## Critérios WCAG cobertos (base)

- **1.3.1** Informações e Relacionamentos (semântica mínima em tabela/campos).
- **1.4.3** Contraste (ajustes de foco e forced-colors).
- **2.1.1** Teclado (skip link e foco visível).
- **2.2.2** Pausar, Parar, Ocultar (redução de animações por preferência).
- **2.4.1** Ignorar blocos (skip link).
- **2.4.7** Foco visível.
- **3.3.2** Rótulos/instruções (fallback de rótulo em campos sem label).
- **4.1.2** Nome, função, valor (roles de alert/status e live regions).

## Checklist para novas telas

- A tela possui `main` único e navegável por teclado.
- A ordem de tabulação é lógica e consistente.
- Campos têm `label` associado (`for`/`id`) ou `aria-label` válido.
- Alertas de erro usam `role="alert"`; mensagens neutras usam `role="status"`.
- Não depender apenas de cor para indicar estado.
- Conteúdo crítico permanece compreensível em temas e alto contraste.

## Observação importante

As regras globais não substituem validações por tela. Fluxos críticos (checkout, fiscal, suporte, admin) devem ter revisão manual de UX e acessibilidade antes de release.
