# Testes automatizados

## Rotas relacionadas

- Transversal (aplica-se a todas as áreas)

## Estrutura

```text
tests/
  unit/
  functional/
```

## Comandos principais

```bash
npm test
npm test -- --tests="tests/unit/**/*.spec.ts"
npm test -- --tests="tests/functional/**/*.spec.ts"
npm test -- tests/unit/pedido.spec.ts
npm test -- --watch
npm test -- --grep="deve criar um pedido"
```

## Smoke test (curl)

```bash
./scripts/smoke-test.sh
```

## Auditoria de integridade das APIs (rota -> controller -> método)

Execute antes de deploy quando houver alteração em `start/routes.ts` ou controllers HTTP.

```bash
node - <<'NODE'
const fs=require('fs');
const path=require('path');
const routes=fs.readFileSync('start/routes.ts','utf8');
const re=/#controllers\/([a-z0-9_]+)\.([a-zA-Z0-9_]+)/g;
const refs=[];
let m;
while((m=re.exec(routes))){refs.push({controller:m[1],method:m[2]});}
const uniq=[...new Map(refs.map(r=>[r.controller+'#'+r.method,r])).values()];
const missingControllers=[];
const missingMethods=[];
for(const r of uniq){
  const file=path.join('app/controllers',`${r.controller}.ts`);
  if(!fs.existsSync(file)){missingControllers.push(`${r.controller}#${r.method}`);continue;}
  const src=fs.readFileSync(file,'utf8');
  const methodRe=new RegExp(`\\n\\s*(public\\s+|private\\s+|protected\\s+)?async\\s+${r.method}\\s*\\(|\\n\\s*(public\\s+|private\\s+|protected\\s+)?${r.method}\\s*\\(`);
  if(!methodRe.test(src)){missingMethods.push(`${r.controller}#${r.method}`);}
}
console.log({missingControllers, missingMethods});
NODE
```

Critério de aceite:

- `missingControllers` vazio.
- `missingMethods` vazio.

## Smoke test visual (Tailwind local)

Executar após mudanças de layout/estilo para garantir que nenhuma tela depende de `tailwind.config` inline ou CDN.

### Pré-check

```bash
npm run build
```

### Rotas críticas para validação manual

- `/dashboard`
- `/cardapio/produtos`
- `/suporte/tickets`
- `/suporte/tickets/novo`
- `/reports`
- `/admin`

### Critérios de aceite

- Layout principal carrega sem estilos quebrados.
- Header, cards e tabelas mantêm espaçamento e tipografia esperados.
- Botões e badges exibem cores corretas (`accent`, `industrial`, `brand`).
- Ícones (Font Awesome) renderizam normalmente.
- Não há aviso no console relacionado a `cdn.tailwindcss.com`.

## Requisitos

- Banco configurado no `.env` com `NODE_ENV=test`
- Migrations rodadas automaticamente pelo runner

## Debug

```bash
DEBUG=* npm test
```

Exemplo de scripts esperados:

```json
{
  "scripts": {
    "test": "node ace test",
    "test:ci": "node ace test --bail"
  }
}
```

## Troubleshooting

### Erro: Timeout nos testes

Aumente o timeout no `adonisrc.ts`:

```typescript
tests: {
  suites: [
    {
      files: ['tests/unit/**/*.spec(.ts|.js)'],
      name: 'unit',
      timeout: 5000,
    }
  ]
}
```

### Erro: Banco de dados não limpo

Verifique se o `truncate()` está sendo chamado:

```typescript
group.each.teardown(async () => {
  await testUtils.db().truncate()
})
```

### Erro: Variáveis de ambiente

Certifique-se de que `.env` está configurado e `NODE_ENV=test` está ativo no ambiente de execução.

## Próximos passos

### Testes a adicionar

- [ ] Testes para Insumos
- [ ] Testes para Fornecedores
- [ ] Testes para Funcionários
- [ ] Testes para Vendas
- [ ] Testes para Notas Fiscais
- [ ] Testes para Caixa
- [ ] Testes E2E com Playwright

### Melhorias

- [ ] Adicionar relatório de cobertura de código
- [ ] Implementar testes de performance
- [ ] Adicionar testes de segurança
- [ ] Criar factories para dados de teste

## Recursos

- [Documentação Japa](https://japa.dev/)
- [Documentação AdonisJS Testing](https://docs.adonisjs.com/guides/testing)
- [Documentação Assert](https://japa.dev/docs/plugins/assert)
