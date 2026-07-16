# Fiscal Emission Fix - Context Summary

## Problema Identificado

Notas fiscais eletrônicas (NFC-e) ficavam com status **PENDING** permanentemente e nunca eram concretizadas (não transitavam para AUTHORIZED).

## Causa Raiz

1. **Execução assíncrona desacoplada** - Venda criada e retornada antes de emissão completar
2. **Sem rastreamento de tentativas** - Notas com erro não podiam ser reprocessadas
3. **Sem mecanismo de retry** - Nenhum sistema automático para recuperação

## Soluções Implementadas

### 1. Migração de Banco de Dados

- **Arquivo**: `database/migrations/1740095400000_add_retry_fields_to_fiscal_notes.ts`
- **Campos adicionados**:
  - `attempt_count` (número de tentativas)
  - `last_attempt_at` (timestamp da tentativa)
  - `last_attempt_error` (erro específico)
  - `is_retryable` (elegível para retry após falha)
  - `uf`, `numero`, `serie` (metadados de emissão)

### 2. Model Fiscal Note Aprimorado

- **Arquivo**: `app/models/fiscal_note.ts`
- **Novos métodos**:
  - `markAsError()` - Registra erro e incrementa attempt_count
  - `markForRetry()` - Volta para PENDING mantendo histórico
  - Validação de limite (máx 5 tentativas)

### 3. Novo Serviço de Reprocessamento

- **Arquivo**: `app/services/fiscal_reprocessing_service.ts`
- **Métodos principais**:
  - `reprocessPendingNotes()` - Batch de até 100 notas
  - `reprocessNote(id)` - Reprocessa uma nota específica
  - `listPendingNotes()` - Lista elegíveis para retry
- **Lógica**: Notas > 2 minutos em PENDING ou ERROR com attempt_count < 5

### 4. ComandaCloseService Melhorado

- **Arquivo**: `app/services/comanda_close_service.ts`
- **Mudanças**:
  - Timeout curto (5s) para resposta imediata ao cliente
  - Continue em background se timeout
  - Melhor logging e tratamento de erro
  - Retorna status da emissão (sucesso/progresso/erro)

### 5. FiscalEmissionWorkflow Aprimorado

- **Arquivo**: `app/services/fiscal_emission_workflow.ts`
- **Validações adicionadas**:
  - Verifica attempt_count antes de reuse
  - Lança erro se atingiu limite de 5 tentativas
  - Registra metadados completos

### 6. Novo Comando CLI

- **Arquivo**: `commands/fiscal_reprocess_pending.ts`
- **Uso**: `npx ace fiscal:reprocess-pending`
- **Saída**: Estatísticas de sucesso/falha/erro

### 7. Novos Endpoints API

- **Arquivo**: `app/controllers/fiscal_controller.ts`
- **Endpoints**:
  - `GET /api/fiscal/pending-notes` - Lista com detalhe
  - `POST /api/fiscal/notes/:id/retry` - Reprocessa manualmente
- **Resposta**: Inclui attempt_count, last_attempt_error, is_retryable

### 8. Novas Rotas

- **Arquivo**: `start/routes.ts`
- **Adições**:

  ```typescript
  GET  /api/fiscal/pending-notes
  POST /api/fiscal/notes/:id/retry
  ```

## Arquitetura de Fluxo

### Antes (Quebrado)

```
Comanda → Venda ✓ → Emit Promise (fire & forget) → FiscalNote PENDING → ∞
```

### Depois (Corrigido)

```
Comanda → Venda ✓ → Emit (5s timeout)
  ├─ Sucesso → AUTHORIZED ✓
  ├─ Timeout → PENDING + background ⏳
  └─ Erro → ERROR + elegível para retry (< 5 tentativas)
→ Reprocessamento automático ou manual via API
→ Eventualmente AUTHORIZED ou CANCELLED
```

## Casos de Uso

### 1. Cliente Fecha Comanda com Emissão

- Venda criada, cliente vê confirmação em 5 segundos
- Se emissão não completar em 5s, continua em background
- Cliente vê status "Emissão em progresso"
- Admin consulta `/api/fiscal/pending-notes`

### 2. SEFAZ Offline/Lento

- Nota criada com PENDING
- Após 2+ minutos, automaticamente reprocessada
- Pode tentar até 5 vezes
- Admin pode forçar retry via `POST /api/fiscal/notes/:id/retry`

### 3. Admin Manualmente Reprocessa

- Vê `GET /api/fiscal/pending-notes`
- Clica "Reprocessar" ou chama `POST /api/fiscal/notes/:id/retry`
- Sistema tenta novamente

### 4. Cron Job Periódico

```bash
# A cada 5 minutos
*/5 * * * * npx ace fiscal:reprocess-pending
```

## Limites e Validações

- **Máximo 5 tentativas**: Após isso, `is_retryable = false` (requer análise manual)
- **Timeout de 60s**: SEFAZ fornece resposta em 60 segundos
- **Retry automático**: Notas PENDING > 2 minutos ou ERROR com tentativas < 5
- **Histórico completo**: Cada tentativa registra timestamp e erro específico

## Observabilidade

Todos os eventos são logados em:

1. **Log local** - Via `logger` AdonisJS
2. **Cloud Logger** - Centralizado para análise

Eventos principais:

- `FISCAL_REUSING_EXISTING_NOTE` - Tentativa de reuse
- `FISCAL_REPROCESSING_START/END` - Batch iniciado/concluído
- `FISCAL_REPROCESSING_SUCCESS` - Nota autorizada
- `FISCAL_REPROCESSING_FAILED` - Nota falhou novamente
- `FISCAL_EMIT_ASYNC_TIMEOUT` - Timeout no emit assíncrono

## Impacto Esperado

✅ **Notas agora transicionam corretamente** para AUTHORIZED/ERROR
✅ **Falhas temporárias são recuperadas** automaticamente
✅ **Admin tem visibilidade e controle** via API e comando CLI
✅ **Histórico rastreável** de tentativas e erros
✅ **Nenhum loop infinito** - máximo 5 tentativas

## Próximos Passos

1. Executar migração: `npx ace migration:run`
2. Build: `npm run build`
3. Testar fluxo de emissão com NFC-e habilitado
4. Configurar cron para `fiscal:reprocess-pending`
5. Monitorar logs por `FISCAL_REPROCESSING` e `attempt_count`

## Ficheiros Modificados

```
✓ database/migrations/1740095400000_add_retry_fields_to_fiscal_notes.ts (novo)
✓ app/models/fiscal_note.ts
✓ app/services/fiscal_reprocessing_service.ts (novo)
✓ app/services/comanda_close_service.ts
✓ app/services/fiscal_emission_workflow.ts
✓ commands/fiscal_reprocess_pending.ts (novo)
✓ app/controllers/fiscal_controller.ts
✓ start/routes.ts
✓ docs/FISCAL_EMISSION_FIX.md (novo)
✓ build/ (compilado com sucesso)
```

## Versionamento

- **Data**: 2026-02-21
- **Versão**: 1.0 (Fix Inicial)
- **Status**: ✅ Build passou, pronto para deploy
