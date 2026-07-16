# Sistema de timezone do usuario

## Rotas relacionadas

- Transversal (todas as telas com datas/horas)

## 📋 Visão Geral

O sistema foi configurado para exibir todas as datas e horários no **timezone do navegador do usuário**, não mais no timezone do servidor.

## 🎯 Solução Implementada

### 1. **Helpers Edge.js** (`app/helpers/edge_helpers.ts`)

Foram adicionados dois novos helpers globais para templates Edge:

```edge
<!-- Para horários (HH:mm) -->
{{{ formatTimestamp(venda.saleDate) }}}
<!-- Resultado: <span data-timestamp="2024-01-01T10:30:00Z"></span> -->

<!-- Para data e hora completas (DD/MM/YYYY HH:mm) -->
{{{ formatDateTimestamp(registro.createdAt) }}}
<!-- Resultado: <span data-timestamp-full="2024-01-01T10:30:00Z"></span> -->
```

⚠️ **IMPORTANTE**: Use `{{{ }}}` (três chaves) para que o HTML não seja escapado!

### 2. **Script Global** (`resources/js/timestamp-formatter.js`)

Um script automático processa todos os elementos com atributos `data-timestamp*` e converte para o timezone local:

- `data-timestamp` → HH:mm (ex: 10:30)
- `data-timestamp-full` → DD/MM/YYYY HH:mm (ex: 01/01/2024 10:30)
- `data-timestamp-date` → DD/MM/YYYY (ex: 01/01/2024)

### 3. **Date Formatter** (`resources/js/date-formatter.js`)

Funções JavaScript disponíveis globalmente via `window.DateFormatter`:

```javascript
// Formatar data e hora completa
DateFormatter.formatDateTime(date)  // "01/01/2024, 10:30"

// Formatar apenas horário
DateFormatter.formatTime(date)  // "10:30"

// Formatar apenas data
DateFormatter.formatDate(date)  // "01/01/2024"

// Formatar com segundos
DateFormatter.formatTimeWithSeconds(date)  // "10:30:45"

// Data relativa
DateFormatter.formatRelativeDate(date)  // "Hoje às 10:30" ou "Há 2 dias às 10:30"

// Verificar se é hoje
DateFormatter.isToday(date)  // true/false

// Data/hora atual
DateFormatter.now()  // Date object
```

## 📝 Como Usar

### Em Templates Edge

#### ❌ NÃO FAÇA MAIS

```edge
<!-- ERRADO - usa timezone do servidor -->
{{ new Date(venda.saleDate).toLocaleTimeString('pt-BR') }}
```

#### ✅ FAÇA

```edge
<!-- CORRETO - usa timezone do usuário -->
{{{ formatTimestamp(venda.saleDate) }}}
```

### Em JavaScript/Frontend

#### ❌ NÃO FAÇA MAIS

```javascript
// ERRADO - formatação manual pode não considerar timezone
element.textContent = new Date(timestamp).toLocaleTimeString('pt-BR')
```

#### ✅ FAÇA - Opção 1 (Recomendada)

```javascript
// Use data-timestamp e deixe o script automático formatar
element.innerHTML = `<span data-timestamp="${timestamp}"></span>`
// O script timestamp-formatter.js formatará automaticamente
```

#### ✅ FAÇA - Opção 2

```javascript
// Use as funções do DateFormatter
element.textContent = DateFormatter.formatTime(timestamp)
```

### Conteúdo Dinâmico (AJAX/Fetch)

Quando adicionar conteúdo via JavaScript:

```javascript
// Adicione o atributo data-timestamp
tbody.innerHTML = sales.map(sale => `
  <tr>
    <td>
      <span data-timestamp="${sale.saleDate}"></span>
    </td>
  </tr>
`).join('')

// O MutationObserver formatará automaticamente!
// Se precisar forçar, chame:
window.TimestampFormatter.processAll()
```

## 🔄 Atualização Automática

O script `timestamp-formatter.js` inclui um **MutationObserver** que detecta automaticamente novos elementos adicionados ao DOM e os formata.

Não é necessário chamar manualmente a formatação, mas se precisar:

```javascript
// Forçar processamento de todos os timestamps
window.TimestampFormatter.processAll()

// Ou processar tipos específicos
window.TimestampFormatter.formatTimestamps()
window.TimestampFormatter.formatDateTimestamps()
window.TimestampFormatter.formatDateOnlyTimestamps()
```

## 📂 Arquivos Modificados

1. **Backend:**
   - `app/helpers/edge_helpers.ts` - Helpers Edge para timestamps

2. **Frontend:**
   - `resources/js/app.js` - Import dos formatadores
   - `resources/js/date-formatter.js` - Funções de formatação
   - `resources/js/timestamp-formatter.js` - Processamento automático

3. **Exemplo de Implementação:**
   - `resources/views/caixa/current.edge` - Tela de caixa atualizada

## 🎨 Exemplos Práticos

### Tabela com Horários

```edge
<tbody>
  @each(venda in vendas)
  <tr>
    <td>{{{ formatTimestamp(venda.saleDate) }}}</td>
    <td>{{ formatCurrency(venda.total) }}</td>
  </tr>
  @end
</tbody>
```

### Card com Data Completa

```edge
<div class="card">
  <p>Criado em: {{{ formatDateTimestamp(registro.createdAt) }}}</p>
</div>
```

### Atualização Dinâmica via AJAX

```javascript
async function updateSales() {
  const response = await fetch('/api/vendas')
  const data = await response.json()
  
  const tbody = document.querySelector('tbody')
  tbody.innerHTML = data.sales.map(sale => `
    <tr>
      <td><span data-timestamp="${sale.saleDate}"></span></td>
      <td>${sale.description}</td>
    </tr>
  `).join('')
  
  // Não precisa chamar formatação - é automático!
}
```

## ⚡ Performance

- O script usa MutationObserver eficiente
- Processa apenas elementos novos
- Não re-processa elementos já formatados
- Baixo impacto na performance

## 🐛 Debugging

Para verificar se os timestamps estão sendo processados:

```javascript
// Ver todos os elementos com timestamps
console.log('Timestamps:', document.querySelectorAll('[data-timestamp]'))
console.log('Full timestamps:', document.querySelectorAll('[data-timestamp-full]'))

// Forçar reprocessamento
window.TimestampFormatter.processAll()
```

## 📌 Notas Importantes

1. **Sempre passe ISO strings do backend** - Use `.toISO()` (Luxon) ou `.toISOString()` (Date)
2. **Use `{{{ }}}` (três chaves)** nos templates Edge para não escapar o HTML
3. **O script é global** - carregado em todas as páginas via `app.js`
4. **MutationObserver detecta mudanças** - formatação automática de conteúdo dinâmico
5. **Timezone é sempre do navegador** - não há configuração manual necessária

## 🔍 Verificação

Para verificar se está funcionando:

1. Abra o console do navegador
2. Execute: `window.DateFormatter`
3. Deve retornar um objeto com as funções
4. Execute: `window.TimestampFormatter`
5. Deve retornar outro objeto com as funções de processamento

## 📚 Referências

- [MDN - Date.toLocaleString()](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)
- [MDN - MutationObserver](https://developer.mozilla.org/pt-BR/docs/Web/API/MutationObserver)
- [Luxon DateTime](https://moment.github.io/luxon/)
