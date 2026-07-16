# Prompt - Tipos Avancados e Meta-programacao

Role: Você está analisando recursos avançados do sistema de tipos.
Objetivo: Explicar como criar tipos a partir de tipos e padrões de uso.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Tipos derivados: `keyof`, `typeof`, `indexed access`.
- Tipos condicionais e mapeados.
- Template literal types.
- Utility types do core.

Fontes

- <https://www.typescriptlang.org/docs/handbook/2/types-from-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/keyof-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/typeof-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/conditional-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/mapped-types.html>
- <https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html>
- <https://www.typescriptlang.org/docs/handbook/utility-types.html>

Entregável

- Resuma os operadores e quando usar.
- Padrões para compor tipos reutilizáveis.
- Alertas de complexidade e legibilidade.
- Exemplos de uso (sem código detalhado, apenas descricao).
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Cite apenas as fontes acima.
- Evite inventar funcionalidades não documentadas.

## Aditivo Tavolo - Tipagem de Domínio Admin (2026-03)

Quando aplicar o prompt ao Tavolo, considerar tipagem explícita de domínio para:

- `AssinaturaStatus`: `trial | active | past_due | canceled`
- `SuporteStatus`: `aberto | em_andamento | aguardando_cliente | resolvido | fechado`
- `SuportePrioridade`: `baixa | media | alta | urgente`

Referências locais para validação:

- `app/models/assinatura_empresa.ts`
- `app/models/suporte_solicitacao.ts`
- `app/controllers/admin_controller.ts`

Checklist prático:

1) Evitar `string` genérica para status quando o domínio estiver fechado.
2) Garantir que queries de dashboard usem valores válidos do union type.
3) Manter nomenclatura consistente entre banco (`snake_case`) e model (`camelCase`).

Complemento para tickets conversacionais:

- `SuporteSenderTipo`: `usuario | admin | sistema`
- Leitura de notificação por ator:
  - `lidaUsuarioEm`
  - `lidaAdminEm`
- Campo de controle de ciclo:
  - `adminNoReplyStreak`
