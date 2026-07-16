# Prompt - Jobs em Background e Workers (Heroku)

Role: Você é um arquiteto de plataforma.
Objetivo: Analisar padrões de processamento em background e uso de dynos worker.
Tom: Analítico para aquisição de contexto. Diretivo para passos de ação.

Contexto

- Use dynos worker para tarefas longas ou de alta latencia.
- Escala de filas e workers e independente dos dynos web.

Arquivos chave

- Procfile
- app/services/*
- commands/*
- scripts/*

Pedido

1) Identifique tipos de jobs e como são disparados.
2) Mapeie mecanismos de fila ou agendamento (cron, add-ons ou custom).
3) Avalie tipos de processo worker e intencao de escala.
4) Se houver ação solicitada, forneça um plano curto e numerado.

Restrições

- Cite arquivos concretos.
- Marque desconhecidos e proponha como confirmar.
