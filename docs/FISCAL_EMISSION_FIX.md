# Análise e Correção: Emissão de Notas Fiscais com Status PENDING

## Problema Identificado

A emissão de notas fiscais eletrônicas (NFC-e) ficava permanentemente com status **PENDING** e nunca era concretizada (não transitava para **AUTHORIZED** ou **ERROR** final).

### Sintomas

- Notas fiscais criadas com `status = 'PENDING'`
- Cliente fechava a comanda e recebia confirmação de venda antes da emissão ser completada
- Notas nunca saíam do status PENDING, impedindo que fossem consultadas ou canceladas
- Sem mecanismo automático de retry para notas com falhas

## Root Causes Identificadas

### 1. **Execução Assíncrona Sem Garantia de Conclusão**

`comanda_close_service.ts` (linhas 40-67)

```typescript
const emitPromise = import('#services/fiscal_service')
  .then(...FiscalService.emitNFCeFromVenda({...}))
  .catch((nfError) => { logger.error(...) })

return { venda, emitPromise }  // Retorna imediatamente!
```

- A venda era criada e retornada ANTES da emissão ser completada
- A promise era disparada no background mas não havia garantia de sucesso
- Erros em timeout ou SEFAZ indisponível resultavam em notas PENDING permanentes

### 2. **Falta de Rastreamento de Tentativas**

O model `FiscalNote` não tinha campos para:

- Número de tentativas realizadas
- Data da última tentativa
- Erro específico da tentativa anterior
- Flag de elegibilidade para retry

### 3. **Sem Mecanismo de Reprocessamento**

Não havia:

- Serviço de reprocessamento de notas pendentes
- Fila ou job para retry automático
- Comando CLI para admin reprocessar manualmente
- Endpoints API para consultar/reprocessar notas

### 4. **Lógica de Reuse de Notas Problemática**

Em `fiscal_emission_workflow.ts`, a lógica de reuse não verificava:

- Se nota já tentou muitas vezes (potencial loop infinito)
- Limite máximo de tentativas

## Soluções Implementadas

### 1. **Migração de Banco de Dados**

Arquivo: `database/migrations/1740095400000_add_retry_fields_to_fiscal_notes.ts`

Adicionados campos ao `fiscal_notes`:

```sql
- attempt_count: INTEGER DEFAULT 0 (número de tentativas)
- last_attempt_at: DATETIME (quando tentou pela última vez)
- last_attempt_error: TEXT (erro específico da última tentativa)
- is_retryable: BOOLEAN DEFAULT true (se pode ser reprocessado)
- uf: VARCHAR(2) (UF de emissão)
- numero: INTEGER (número sequencial)
- serie: INTEGER DEFAULT 1 (série)
```

### 2. **Aprimoramento do Model FiscalNote**

Arquivo: `app/models/fiscal_note.ts`

Novos campos:

```typescript
@column({ columnName: 'attempt_count' })
declare attemptCount: number

@column({ columnName: 'last_attempt_at' })
declare lastAttemptAt: DateTime | null

@column({ columnName: 'last_attempt_error' })
declare lastAttemptError: string | null

@column({ columnName: 'is_retryable' })
declare isRetryable: boolean
```

Novos métodos:

```typescript
async markAsError(errorDetails)  // Registra tentativa e incrementa counter
async markForRetry()  // Volta nota para PENDING sem contar como nova tentativa
```

### 3. **Novo Serviço de Reprocessamento**

Arquivo: `app/services/fiscal_reprocessing_service.ts`

Funcionalidades:

- `reprocessPendingNotes()` - Reprocessa até 100 notas com status PENDING/ERROR que ainda são elegíveis
- `reprocessNote(id)` - Reprocessa uma nota específica
- `listPendingNotes()` - Lista notas pendentes/com erro elegiveis para retry

Lógica:

- Encontra notas com `status = 'PENDING'` e `updated_at` > 2 minutos (timeout presumido)
- Encontra notas com `status = 'ERROR'` e `attempt_count < 5`
- Tenta emitir novamente via `FiscalService.emitNFCe()`
- Registra resultado (sucesso/falha) em logs e cloud logger

### 4. **Melhoria do ComandaCloseService**

Arquivo: `app/services/comanda_close_service.ts`

Mudanças:

- Emissão com timeout curto (5 segundos) para resposta imediata
- Se timeout, emissão continua em background mas avisa cliente
- Melhor tratamento de erros com logging estruturado
- Retorna informações sobre o sucesso/status da emissão

### 5. **Validação e Retry na Emission Workflow**

Arquivo: `app/services/fiscal_emission_workflow.ts`

Melhorias na lógica de reuse:

```typescript
if (existingNote) {
  // Verifica limite de tentativas ANTES de tentar novamente
  if (existingNote.attemptCount >= 5) {
    throw new Error(`Nota atingiu limite de tentativas (5)`)
  }
  // Reusa nota existente
}
```

### 6. **Novo Comando CLI para Reprocessamento**

Arquivo: `commands/fiscal_reprocess_pending.ts`

Uso:

```bash
npx ace fiscal:reprocess-pending
```

Resultado:

- Processa notas pendentes
- Exibe estatísticas de sucesso/falha
- Útil para executar periodicamente (cron)

### 7. **Novos Endpoints API**

Arquivo: `app/controllers/fiscal_controller.ts`

Novos endpoints:

```
GET /api/fiscal/pending-notes
  → Lista notas pendentes/com erro elegíveis para reprocessamento
  → Retorna: id, venda_id, status, attempt_count, last_attempt_at, etc

POST /api/fiscal/notes/:id/retry
  → Reprocessa uma nota específica manualmente
  → Validação: nota deve estar PENDING ou ERROR e is_retryable=true

GET /api/fiscal/pending-notes (com dados detalhados de filtro)
```

### 8. **Novas Rotas**

Arquivo: `start/routes.ts`

Adicionadas rotas:

```typescript
router.get('/pending-notes', 'fiscal_controller.listPendingNotes')
router.post('/notes/:id/retry', 'fiscal_controller.retryEmissionNote')
```

## Fluxo Corrigido de Emissão

### Antes (Quebrado)

```
Comanda Close 
→ Venda Created  
→ Emit Promise (Fire & Forget) 
→ FiscalNote PENDING 
→ (Error: Status never changes)
```

### Depois (Corrigido)

```
Comanda Close 
→ Venda Created  
→ Emit (with 5s timeout)
  ├─ If Success: FiscalNote AUTHORIZED ✓
  ├─ If Timeout: Continue in background, warn user, increment attempt_count
  └─ If Error: FiscalNote ERROR, mark as retryable if < 5 attempts
→ Return venda + status da emissão
→ [Background] Reprocessar se elegível
→ [Admin] Pode chamar /api/fiscal/notes/:id/retry manualmente
→ [Cron] Pode rodas fiscal:reprocess-pending periodicamente
```

## Configuração Recomendada

### 1. **Executar Migração**

```bash
npm run build
npx ace migration:run
```

### 2. **Configurar Reprocessamento Automático** (opcional)

Adicionar ao crontab ou job scheduler:

```bash
# A cada 5 minutos
*/5 * * * * cd /app && npx ace fiscal:reprocess-pending
```

### 3. **Monitorar Notas Pendentes**

Dashboard ou alertas para:

```
GET /api/fiscal/pending-notes
```

Se houver notas PENDING > 5 minutos, alertar admin.

## Campos de Rastreamento

A cada tentativa de emissão, registra-se:

- `attempt_count` - incrementado a cada tentativa
- `last_attempt_at` - timestamp da tentativa
- `last_attempt_error` - erro específico (ex: "timeout", "SEFAZ_indisponível", etc)
- `is_retryable` - falso após 5 tentativas (requer análise manual)
- `status` - PENDING/AUTHORIZED/ERROR/CONTINGENCY

## Limite de Tentativas

- Máximo 5 tentativas automáticas
- Após 5 tentativas: `is_retryable = false`
- Admin deve revisar manualmente (possível problema de configuração, certificado, dados inválidos)

## Logging e Observabilidade

Todas as ações são registradas em:

1. **Logger local** (`logger.info`, `logger.error`)
2. **Cloud Logger** (RapidaQuick/CloudFlare) para análise centralizada

Eventos capturados:

- `FISCAL_REUSING_EXISTING_NOTE` - Tentativa de reuse
- `FISCAL_ATTEMPT_COUNT_EXCEEDED` - Limite atingido
- `FISCAL_REPROCESSING_START/END` - Início/fim do reprocessamento
- `FISCAL_REPROCESSING_SUCCESS/FAILED` - Resultado individual
- `FISCAL_REPROCESSING_FATAL_ERROR` - Erro no batch

## Próximos Passos Recomendados

1. ✅ **Executar migration e rebuild**: `npm run build`
2. ✅ **Testar fluxo de emissão**:
   - Fechar comanda com emissão NFC-e
   - Verificar se nota vai para AUTHORIZED
   - Se falhar, testar `/api/fiscal/pending-notes`
3. ✅ **Monitorar logs** por `FISCAL_REPROCESSING`
4. ✅ **Configurar cron** para reprocessamento automático
5. ✅ **Revisar notas com `is_retryable=false`** - podem indicar problemas estruturais

## Impacto

- ✅ Notas fiscais agora transicionam corretamente para AUTHORIZED/ERROR
- ✅ Notas com falha temporária são recuperadas automaticamente
- ✅ Admin tem visibilidade e controle sobre notas pendentes
- ✅ Histórico de tentativas facilita debugging
- ✅ Limite de 5 tentativas evita loops infinitos
