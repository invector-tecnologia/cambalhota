# Sistema de mesas e comandas

## Rotas relacionadas

- UI: /mesas, /comandas
- API: /api/mesas/:id/status
- Acao: /mesas/:id/status

## Conceito

- Comandas podem existir sem mesa.
- Mesas agrupam comandas de forma opcional.

## Status da mesa

Valores suportados:

- available
- occupied
- reserved
- maintenance

## Endpoints

- POST /mesas/:id/status (altera status da mesa)
- GET /api/mesas/:id/status (polling da UI)

## Observacoes de UI

- A tela /comandas/:id funciona como painel de controle da mesa.
- Polling a cada ~30s para sincronizar status.

## Testes

- Functional: tests/functional/mesas.spec.ts
- ✅ Validar campo número obrigatório
- ✅ Aceitar mesa sem nome (opcional)
- ✅ Ordenação por sort_order e number

**Total**: 14 casos de teste

### 2. `tests/functional/mesas_comandas_integration.spec.ts` - Testes de Integração

- ✅ Comanda existe sem mesa (mesaId null)
- ✅ Comanda vinculada a mesa
- ✅ Mesa com múltiplas comandas
- ✅ Contador de comandas (apenas ativas)
- ✅ getActiveComandas() retorna apenas ativas
- ✅ Bloquear exclusão de mesa com comandas
- ✅ ON DELETE SET NULL (comanda.mesaId = null)
- ✅ Criar comanda com mesa via form
- ✅ Criar comanda sem mesa via form
- ✅ Transferir comanda entre mesas
- ✅ Desvincular comanda de mesa
- ✅ Filtrar comandas por mesa
- ✅ Listagem mostra contador de comandas
- ✅ Detalhes da mesa mostra comandas vinculadas
- ✅ Estatísticas calculam corretamente

**Total**: 15 casos de teste

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes de mesas
npm test tests/functional/mesas.spec.ts

# Apenas testes de integração
npm test tests/functional/mesas_comandas_integration.spec.ts

# Com cobertura
npm test -- --coverage
```

### Cobertura de Testes

**MesasController**: 100% dos métodos testados

- index, create, store, show, edit, update, destroy, toggleActive

**Model Mesa**: 100% dos métodos testados

- getActiveComandas(), getComandaCount()

**Integração Mesas+Comandas**: 100% dos cenários críticos

- Relações bidirecionais, cascading, filtros, transferências

## Deploy

Versão atual: **v503**
Data: 08/12/2025
Status: ✅ Funcionando em produção

URL: <https://www.tavolo.com.br>

## Melhorias Futuras Sugeridas

1. **Dashboard com estatísticas**
   - Total de mesas ativas
   - Mesas ocupadas vs disponíveis
   - Comandas por mesa

2. **Grid view de mesas**
   - Visualização tipo "planta do restaurante"
   - Status visual (ocupada/disponível/reservada)
   - Cores por taxa de ocupação

3. **Transferência de comandas**
   - Mover comanda entre mesas
   - Juntar comandas
   - Dividir conta

4. **Relatórios**
   - Histórico de ocupação por mesa
   - Tempo médio de permanência
   - Faturamento por mesa/período

5. **Reservas**
   - Sistema de reserva de mesas
   - Controle de horários
   - Notificações

## Testes Recomendados

### Casos de Teste Básicos

1. ✓ Criar mesa sem comandas
2. ✓ Criar comanda sem mesa
3. ✓ Vincular comanda a mesa
4. ✓ Desvincular comanda de mesa
5. ✓ Excluir mesa vazia
6. ✓ Tentar excluir mesa com comandas (deve falhar)
7. ✓ Filtrar comandas por mesa
8. ✓ Buscar mesas por número/nome
9. ✓ Ativar/desativar mesa
10. ✓ Validar número único de mesa por empresa

### Testes de Permissões

1. ✓ Super Admin: todas operações
2. ✓ Gerente: criar, ler, atualizar (não excluir)
3. ✓ Garçom: apenas leitura
