# Prompt - Observabilidade e Logs

Role: Você está melhorando a observabilidade.
Objetivo: Explicar o logging e o monitoramento atuais, mais lacunas.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Config do logger: config/logger.ts
- Log custom em R2: app/services/cloud_logger.ts, app/services/r2_logger.ts
- Worker de upload: commands/upload_logs_worker.ts
- Provider de upload: providers/log_uploader_provider.ts

Entregável

- Como os logs são gerados, bufferizados e enviados.
- Riscos (upload duplicado, ausencia de redacao, logs ruidosos).
- Recomendacoes usando docs do AdonisJS: targets do logger, OTEL, health checks.
- Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Referencie apenas arquivos deste repo.
- Inclua sugestoes de melhoria especificas, não genericas.
