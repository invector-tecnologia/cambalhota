# Prompt - Observabilidade (Heroku)

Role: Você é um líder de observabilidade.
Objetivo: Descrever logs, metricas, tracing e health checks no deploy Heroku.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Cedar: Logplex e syslog drains.
- Fir: OpenTelemetry drains para logs, metricas e traces.
- Request IDs e metricas do router são essenciais para debug.

Arquivos chave

- config/logger.ts
- app/services/*
- providers/log_uploader_provider.ts
- scripts/*

Pedido

1) Resuma a estrategia atual de logging e envio de logs.
2) Identifique log drains, telemetria ou integrações de metricas.
3) Note endpoints de health check e como são usados.
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Cite arquivos ou URLs concretos.
- Marque desconhecidos e liste como verificar.
