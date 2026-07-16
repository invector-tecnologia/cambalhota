# Sistema de formatacao numerica (pt-BR)

## Rotas relacionadas

- Transversal (todas as telas com valores numericos)

## Padrao

- Milhar: ponto
- Decimal: virgula
- Exemplo: R$ 1.234,56

## Helpers (backend)

Arquivo: app/helpers/number_formatter.ts

- formatDecimalBR(value, decimals = 2)
- formatCurrencyBR(value, showSymbol = true)
- parseBRToNumber(value)
- parseBRToString(value)

## Helpers (Edge)

Arquivo: app/helpers/edge_helpers.ts

- formatCurrency(value, showSymbol = true)
- formatDecimal(value, decimals = 2)
- formatNumber(value)

## Frontend

Arquivo: resources/js/number-formatter.js

- data-mask="currency"
- data-mask="decimal" + data-decimals

## Exemplo (Edge)

```edge
<p>Total: {{ formatCurrency(venda.total) }}</p>
<input name="price" value="{{ formatCurrency(produto.price, false) }}" data-mask="currency">
```

### Módulo Insumos (100%)

- ✅ `create.edge` - Máscaras aplicadas em todos campos numéricos
- ✅ `edit.edge` - Helpers Edge.js para exibição + máscaras
- ✅ `insumos_controller.ts` - `parseBRToNumber` em todas validações

### Campos Refatorados

**Preços (com máscara `currency`):**

- `purchase_price`
- `cost_price`
- `sale_price`

**Estoques (com máscara `decimal`):**

- `current_stock`
- `minimum_stock`
- `maximum_stock`

**Outros:**

- `conversion_factor`
- `tax_rate`

---

## 📝 Checklist para Refatorar Outros Módulos

Ao aplicar o sistema em outros módulos, siga este checklist:

### Backend (Controller)

- [ ] Importar `parseBRToNumber` do helper
- [ ] Substituir transformações manuais por `parseBRToNumber(value)`
- [ ] Usar `?? 0` para campos obrigatórios, `null` para opcionais

### Views (Edge Templates)

**Exibição (show/index):**

- [ ] Substituir `.toLocaleString()` manual por `formatCurrency()`
- [ ] Usar `formatNumber()` para quantidades (remove zeros)
- [ ] Usar `formatDecimal()` quando precisar casas decimais fixas

**Formulários (create/edit):**

- [ ] Adicionar `data-mask="currency"` em campos de preço
- [ ] Adicionar `data-mask="decimal"` em campos de quantidade
- [ ] Usar helpers Edge.js para valor inicial: `value="{{ formatCurrency(value, false) }}"`
- [ ] Remover scripts manuais de formatação

### Testes

- [ ] Testar criação com valores brasileiros (ex: "1.234,56")
- [ ] Testar edição com valores pré-existentes
- [ ] Verificar que valores são salvos corretamente no banco
- [ ] Confirmar que máscaras funcionam ao digitar

---

## 🚀 Próximos Passos

1. Refatorar módulo **Fornecedores**
2. Refatorar módulo **Pedidos**
3. Refatorar módulo **Vendas**
4. Refatorar módulo **Cardápio** (produtos)
5. Refatorar módulo **Caixa** (movimentações)
6. Refatorar módulo **Comandas**
7. Testar sistema completo end-to-end

---

## 🐛 Troubleshooting

**Máscara não está funcionando:**

- Verificar se `resources/js/app.js` importa `number-formatter.js`
- Confirmar que Vite compilou os assets
- Verificar console do browser para erros JavaScript

**Valores não salvam corretamente:**

- Confirmar que controller usa `parseBRToNumber()`
- Verificar rede no DevTools: payload deve ter números (ex: 1234.56)
- Checar logs do servidor para erros de validação

**Formatação não aparece:**

- Helpers Edge.js registrados? Verificar `start/edge.ts` no `preloads`
- Valor é `null`? Helpers retornam string vazia para null

---

**Última atualização:** 04/12/2025
