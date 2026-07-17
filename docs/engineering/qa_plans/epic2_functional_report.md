# Epic 2: Functional Test Report (TUI & Concurrency)

## Visão Geral
Este relatório detalha os testes funcionais exploratórios conduzidos no executável `cambalhota` para validar a implementação da Interface de Terminal (TUI) e o isolamento de concorrência com o subprocesso, referenciados no **ADR-002**.

## 1. Compilação e Testes Unitários
- **Build (`nimble build`)**: Sucesso. O binário `./cambalhota` compila sem erros (backend C, multithreading habilitado).
- **Unit Tests (`nimble test`)**: Sucesso. Todos os testes passam, confirmando a estabilidade base dos módulos de config, checks e worker de extração.

## 2. Testes de Fluxo e Resiliência da TUI

### 2.1 Happy Path (StSuccess)
- **Ação:** Executar a aplicação TUI em um cenário válido de comando (atual _hardcoded_ `pg_dump --version`).
- **Resultado:** A TUI (`tatui`) é instanciada corretamente e não bloqueia enquanto o subprocesso executa em _background_. A saída (STDOUT) flui via _channels_ e é renderizada em tempo real. O estado transita graciosamente para `stSuccess` ao término. 
- **Status:** **PASS** ✅

### 2.2 Falha no Subprocesso (Fail-safe UI)
- **Ação:** Executar a TUI forçando uma falha de binário (ex: invocando um executável inexistente).
- **Resultado:** A thread trabalhadora intercepta a exceção e envia uma mensagem do tipo `mkError` via channel. A TUI recebe o evento, altera o título para `stError` (borda vermelha) e exibe o log de erro no painel. O loop principal não "crasha"; a interface continua operante esperando que o usuário pressione 'q'.
- **Status:** **PASS** ✅ (Cumpre integralmente o comportamento _fail-safe_ visual descrito no ADR-002).

## 3. Validação Semântica (Bugs Encontrados)

### 🚨 Falha: Ausência de Validação do Schema "public" na CLI
- **Problema:** A especificação exige que: *"falhas (como tentar usar o schema public) lançam alertas visuais fail-safe"*. Atualmente, o executável `./cambalhota` não realiza parse de argumentos de linha de comando. Além disso, o arquivo `src/db/config.nim` possui apenas um comentário sobre a restrição do schema, mas nenhuma lógica em _runtime_ levanta erro se `schema == "public"` for configurado e passado à camada de extração.
- **Impacto:** O utilitário corre risco de rodar queries não autorizadas no schema `public`.
- **Sugestão de Correção (Engineering):** 
  1. Implementar o parseamento de argumentos na CLI (`std/parseopt`).
  2. Implementar a validação na função `initPgConfig` (ou no inicializador da CLI) que jogue um Erro Crítico antes da chamada ao banco, disparando o evento `stError` na TUI caso o schema solicitado seja o `public`.
- **Status:** **PASS** ✅ (Bug fix aplicado e testado com sucesso)

### 3.1 Re-teste (Validação do Bug Fix ADR-003)
- **Ação:** Executar a aplicação via CLI forçando a violação do schema com `./cambalhota --schema public` (e também omitindo `--schema` para testar o fallback).
- **Resultado:** O executável agora suporta argumentos via CLI. Ao tentar utilizar o schema proibido, a validação de _Hard Block_ é acionada. A interface gráfica (TUI) inicia e imediatamente exibe o alerta de erro `stError` com a mensagem visual: `"ERROR: Uso do schema public é proibido"`. O processo em background aborta de forma segura sem disparar o `pg_dump`. O fallback caso `--schema` não seja providenciado foi ajustado para `"Cambalhota"`.
- **Status:** **PASS** ✅

## Conclusão
A arquitetura base (TUI + Worker Threads com Channels) manteve sua estabilidade. O débito técnico referente ao _Hard Block_ do schema `public` foi integralmente solucionado através do parseamento dos parâmetros pela CLI e da regra preventiva acoplada à TUI. As blindagens _fail-safe_ estão validadas.

**Decisão QA:** Aprovado. O Épico 2 foi inspecionado, os requisitos de resiliência e bloqueio de schema proibido foram cumpridos com eficácia. **QA Pass**.
