# Guia Rápido: Como Usar as Novas Funcionalidades de Fiscal

## Problema Resolvido

Notas fiscais ficavam com status PENDING e nunca eram autorizadas.

## Para o Cliente (UI)

Ao fechar comanda com emissão NFC-e:

- ✅ Recebe confirmação de venda imediatamente
- ✅ Emissão continua em background se não completar em 5s
- ⚠️ Se mensagem "Emissão em progresso", verifique status em 2 minutos

## Para o Admin (API)

### 1. Ver Notas Pendentes/Erro

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.tavolo.com/api/fiscal/pending-notes
```

Resposta:

```json
{
  "success": true,
  "data": {
    "total": 3,
    "notes": [
      {
        "id": "uuid-123",
        "venda_id": 42,
        "status": "PENDING",      // ou ERROR
        "attempt_count": 1,       // de 5
        "last_attempt_at": "2026-02-21T10:30:00Z",
        "last_attempt_error": "SEFAZ_TIMEOUT",
        "is_retryable": true      // false se attempt_count >= 5
      }
    ]
  }
}
```

### 2. Reprocessar Manualmente

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://api.tavolo.com/api/fiscal/notes/{id}/retry
```

Resposta:

```json
{
  "success": true,
  "message": "Nota reprocessada com sucesso"
}
```

## Para o Sysadmin (CLI)

### Reprocessar Notas Pendentes em Batch

```bash
# Rodas manualmente
npx ace fiscal:reprocess-pending

# Saída
Resultado do reprocessamento:
  - Total processado: 8
  - Sucesso: 6
  - Falhou: 2

[Erros encontrados:
  - uuid-444: SEFAZ_INDISPONIVEL
  - uuid-555: CERTIFICADO_EXPIRADO
```

### Configurar Reprocessamento Automático (Cron)

```bash
# Adicionar ao crontab (reprocessar a cada 5 minutos)
*/5 * * * * cd /home/bro/projetos/tavolo && npx ace fiscal:reprocess-pending >> /var/log/fiscal-retry.log 2>&1
```

## Limites

- **Máximo 5 tentativas** por nota
- **Timeout SEFAZ**: 60 segundos
- **Auto-retry**: Notas PENDING > 2 minutos
- **Batch**: Até 100 notas por execução

## Campos Importantes

| Campo | Significado |
|-------|-------------|
| `status` | PENDING \| AUTHORIZED \| ERROR \| CANCELLED \| CONTINGENCY |
| `attempt_count` | Quantas vezes foi tentada (0-5) |
| `is_retryable` | Se pode ser reprocessada (false se attempt_count >= 5) |
| `last_attempt_at` | Quando foi tentada pela última vez |
| `last_attempt_error` | Erro específico (SEFAZ_TIMEOUT, CERTIFICADO_EXPIRADO, etc) |

## Fluxograma de Decisão

```
Nota PENDING ou ERROR?
  │
  ├─ SIM: is_retryable = true?
  │   ├─ SIM: attempt_count < 5?
  │   │   ├─ SIM: Pode reprocessar
  │   │   │   ├─ Automático (a cada 2+ min)
  │   │   │   └─ Manual (POST /api/fiscal/notes/:id/retry)
  │   │   └─ NÃO: Precisa análise manual
  │   └─ NÃO: Atingiu limite (5 tentativas)
  │       → Revisar last_attempt_error
  │       → Verificar certificado/dados
  │       → Corrigir e criar nova nota manualmente
  │
  └─ NÃO: Verifique status atual
```

## Debug: Erros Comuns

### `SEFAZ_TIMEOUT`

- SEFAZ indisponível ou lento
- ✅ Auto-retry a cada 2 minutos
- ✅ Admin pode forçar `POST /retry`

### `CERTIFICADO_EXPIRADO`

- Certificado fiscal venceu
- ❌ Não retentará automaticamente após 5 tentativas
- ✅ Renove certificado em `/config/fiscal`
- ✅ Manualmente crie nova nota

### `XML_INVÁLIDO` / `DADOS_INCOMPLETOS`

- Dados de venda/empresa incertos
- ❌ Não auto-retry
- ✅ Corrija dados da empresa
- ✅ Crie nova venda e tente novamente

### `UF_NÃO_SUPORTADO`

- Estado não está habilitado em `/config/fiscal`
- ❌ Não retentará
- ✅ Configure UF em configuração fiscal

## Health Check

Para verificar se sistema está funcionando:

```bash
# 1. Ver notas pendentes
curl https://api.tavolo.com/api/fiscal/pending-notes

# 2. Se houver PENDING > 10 minutos:
# 🚨 ALERTA: Sistema pode estar com problema

# 3. Verificar logs
tail -f /var/log/tavolo/application.log | grep FISCAL_REPROCESSING

# 4. Se ver "FATAL_ERROR", revisar certificado e SEFAZ conectividade
```

## Suporte

Dados para debug (deixe admin coletando):

```json
{
  "fiscal_note_id": "uuid-xxx",
  "venda_id": 123,
  "status": "PENDING ou ERROR",
  "attempt_count": 3,
  "last_attempt_error": "...",
  "uf": "SP",
  "is_homologacao": true/false,
  "timestamp": "2026-02-21T..."
}
```

---

Para dúvidas detalhadas, veja [FISCAL_EMISSION_FIX.md](./docs/FISCAL_EMISSION_FIX.md)
