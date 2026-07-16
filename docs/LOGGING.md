# Logging e envio para R2

## Objetivo

Centralizar o padrao de logs da aplicacao e o envio para Cloudflare R2.

## Rotas relacionadas

- Transversal (aplica-se a todas as areas)

## Variaveis de ambiente

- LOG_UPLOAD_ENABLED=true
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_ENDPOINT
- R2_BUCKET
- LOG_UPLOAD_INTERVAL_SECONDS=30

## Uso no codigo

```ts
import cloudLogger from '#services/cloud_logger'

cloudLogger.info('Mensagem', { context: 'exemplo' })
cloudLogger.warn('Aviso', { id: 123 })
cloudLogger.error('Erro', { error: err.message })
```

## Worker

- Comando: node ace upload:logs:worker
- Rodar em dyno separado ou via scheduler.

## Observacoes

- O worker usa buffer em memoria e nao deve bloquear o processo web.
- Logs devem evitar dados sensiveis.
