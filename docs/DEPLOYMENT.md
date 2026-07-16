# Deployment

## Rotas relacionadas

- Transversal (aplica-se a todas as áreas)

## Pré-requisitos

- `.env` configurado (`DB`, `APP_KEY`, `FISCAL_ENCRYPTION_KEY` se fiscal ativo)
- Banco com migrations em dia
- Build sem erros

## Passo a passo

```bash
npm install
npm run build
node ace migration:run
node build/bin/server.js
```

## Validação rápida

```bash
./scripts/smoke-test.sh
```

## Worker de logs (opcional)

```bash
node ace upload:logs:worker
```

## Rollback

- Volte para o release anterior (git ou ferramenta de deploy).
- Recompile e reinicie o servidor.

```bash
npm run build
pm2 restart tavolo
```

## Troubleshooting

### Problema: Build falha após alterações de UI

**Solução:**

```bash
npm run build
```

Se o erro for de CSS/Tailwind, valide `tailwind.config.js`, `postcss.config.js` e `resources/css/app.css`.

### Problema: Layout degradado após deploy

**Solução:**

- Verifique se os assets foram gerados em `public/assets`.
- Faça hard refresh no browser para invalidar cache local.
- Confirme se `@vite(['resources/css/app.css', 'resources/js/app.js'])` está presente nas views críticas.

### Problema: Performance degradada

**Solução:**

- Verifique logs de aplicação e consultas lentas.
- Reavalie páginas com tabelas grandes e filtros sem índice.

## Monitoramento pós-deploy

### Métricas a acompanhar

- Taxa de erro HTTP (4xx/5xx)
- Tempo médio de resposta por rota crítica
- Erros de build/deploy em release
- Logs de falhas em fluxos de suporte/fiscal/financeiro

### Rotas para smoke test manual

- `/dashboard`
- `/cardapio/produtos`
- `/suporte/tickets`
- `/reports`
- `/admin`

## Deploy checklist final

- [ ] Build compilou sem erros
- [ ] Migrations aplicadas (quando necessário)
- [ ] Smoke test executado
- [ ] Documentação/changelog atualizados
- [ ] Plano de rollback validado
- [ ] Equipe notificada

## Status

✅ Pronto para deploy quando todos os itens do checklist estiverem concluídos.
