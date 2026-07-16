# Debug de Transmissão Fiscal - Notas Ficando PENDING

## Problema Identificado

**Sintoma:** Notas fiscais ficam com status `PENDING` indefinidamente, sem `protocol_number`, mesmo após transmissão bem-sucedida ao SEFAZ.

### Evidências

1. **Consulta SEFAZ confirma recebimento:**
   - Nota 17 recebida pelo SEFAZ em `2026-02-10T20:20:54`
   - Chave no SEFAZ: `33250131968879000193650010000000171226778848`

2. **Banco local sem registro da transmissão:**
   - Única nota 17 no banco criada às `23:11:48` (3h depois)
   - Status: `PENDING`
   - Sem `protocol_number`
   - Chave diferente: `33260231968879000193650010000000171477556892`

3. **Tentativa posterior gera cStat 613:**
   - Segunda tentativa (23:11) gera novo cNF
   - SEFAZ rejeita por chave divergente (cStat 613)

### Causa Raiz

O fluxo de emissão estava **travando dentro da validação XSD** (`validateWithXsdIfEnabled`) e não seguia para transmissão. Logs mostram assinatura e geração de QR Code concluídas, mas a validação XSD nunca finaliza.

## Correções Aplicadas (v1356)

### 1. Logging Detalhado

Adicionados logs em pontos críticos do fluxo:

```typescript
// Antes/depois de assinatura
'[FISCAL_SERVICE] SIGN_XML_START'
'[FISCAL_SERVICE] SIGN_XML_SUCCESS'

// Antes/depois de autorização
'[FISCAL_SERVICE] AUTHORIZE_START'
'[FISCAL_TRANSMITTER] PARSE_RESPONSE_START'
'[FISCAL_TRANSMITTER] PARSE_RESPONSE_SUCCESS'
'[FISCAL_TRANSMITTER] RETURNING_SUCCESS_RESPONSE'

// Resultado
'[FISCAL_SERVICE] AUTHORIZE_RESULT_RECEIVED'
'[FISCAL_SERVICE] MARK_AS_AUTHORIZED_START'
```

### 2. Stack Traces em Exceptions

```typescript
catch (processingError) {
  const errorStack = processingError instanceof Error ? processingError.stack : undefined
  cloudLogger.error('FISCAL_PROCESSING_ERROR', {
    error: errorMsg,
    stack: errorStack  // ← Agora captura stack completo
  })
}
```

### 3. Timeout Aumentado

```typescript
// Antes: 30000ms (30s)
// Depois: 60000ms (60s)
return 60000
```

### 4. Timeout de Validação XSD

Para evitar travas indefinidas, a validação XSD agora possui timeout.

```typescript
// Default: 5000ms, configurável via FISCAL_SEFAZ_XSD_TIMEOUT_MS
const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000
return Promise.race([runValidation(), timeoutPromise])
```

Se o timeout ocorrer, o erro é tratado como infra e a emissão segue sem validar.

### 5. HTTP 400 (Bad Request) na Autorizacao

Se a SEFAZ responder HTTP 400 com corpo `Bad Request`, o fluxo tenta novamente usando SOAP 1.1 (`text/xml; charset=utf-8`) com header `SOAPAction` **entre aspas**. Se ainda falhar, tenta SOAP 1.1 com `SOAPAction` **sem aspas**. Se persistir, tenta SOAP 1.1 **sem SOAP Header** (apenas Body), pois alguns endpoints SVRS rejeitam o header `nfeCabecMsg`.

### 4. Logs de Status da Resposta

```typescript
cloudLogger.info('FISCAL_AUTHORIZE_RESULT', {
  status: transmissionResult.status,
  hasError: !!transmissionResult.error,
  hasProtocol: !!transmissionResult.protocolNumber,  // ← Rastreia se protocolo está presente
})
```

## Próximos Passos

### Para Testar

1. Emitir nova nota fiscal (venda diferente)
2. Ou reprocessar nota 17 PENDING (mesma venda)
3. Capturar logs críticos do CloudLogger

### Logs a Verificar

```bash
# Logs do fluxo completo
heroku logs --source app --tail | grep 'FISCAL'

# Logs críticos específicos
- FISCAL_EMIT_START
- FISCAL_SIGN_XML_START/SUCCESS
- FISCAL_AUTHORIZE_START
- FISCAL_AUTHORIZE_RESULT
- FISCAL_MARK_AS_AUTHORIZED_START
- FISCAL_AUTHORIZED (sucesso) ou FISCAL_PROCESSING_ERROR (falha)
```

### Se Problema Persistir

1. **Verificar se `authorizeWithTimeout` completa:**
   - Buscar log `AUTHORIZE_RESULT_RECEIVED`
   - Se não existir → timeout ou exception em `FiscalTransmitter`

2. **Verificar se `markAsAuthorized` é chamado:**
   - Buscar log `MARK_AS_AUTHORIZED_START`
   - Se não existir → problema no parse da resposta ou condição de `if`

3. **Capturar resposta do SEF AZ:**
   - Log `FISCAL_SEFAZ_RESPONSE_SNIPPET` contém primeiros 1000 chars
   - Verificar se tem `<protNFe>` e `<infProt><chNFe>` na resposta

## Reuso de XML Implementado

**Status:** ✅ Implementado (v1354)

```typescript
// Busca nota PENDING/ERROR existente antes de gerar novo XML
let existingNote = await FiscalNote.query()
  .where('venda_id', venda.id)
  .whereIn('status', ['PENDING', 'ERROR'])
  .whereNotNull('xml_content')
  .whereNotNull('access_key')
  .first()

if (existingNote) {
  // Reutiliza XML e número → mesma chave de acesso
  xmlContent = existingNote.xmlContent!
  reservedNumber = existingNote.numero!
  fiscalNote = existingNote
}
```

**Logs de Reuso:**

- `[FISCAL_SERVICE] REUSING_EXISTING_NOTE` - quando reutiliza nota existente

## Histórico

- **2026-02-10 20:20:** Primeira tentativa nota 17 - transmitida mas não gravada
- **2026-02-10 22:00:** Limpeza de 48 notas órfãs (sem access_key)
- **2026-02-10 23:11:** Segunda tentativa nota 17 - novo cNF → cStat 613
- **2026-02-10 23:50:** Deploy v1356 com logs detalhados

## Referências

- [fiscal_emission_workflow.ts](../app/services/fiscal_emission_workflow.ts) - Orquestração do fluxo
- [fiscal_transmitter.ts](../app/services/fiscal_transmitter.ts) - Comunicação SOAP/HTTPS com SEFAZ
- [SEFAZ Webservices](https://www.nfe.fazenda.gov.br/portal/webServices.aspx) - Documentação oficial
