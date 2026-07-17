# Relatório Funcional de QA - Epic 3 (Restore Engine e Listagem Local)

**Data:** 2026-07-17
**Referência:** [ADR 005 - Engine de Restore, Mecânica Reversa Anti-OOM e Listagem Local](../adrs/005_restore_engine_and_local_listing.md)
**Status do Épico:** [Concluído] [QA Aprovado]

## 1. Resumo da Validação (QA Pass)
A implementação arquitetada pela Engenharia com base no **ADR 005** foi inspecionada. O código e os testes integrados garantem a conformidade das funcionalidades de listagem do diretório local `~/.cambalhota/db_dumps/YYYY/` e do Restore OOM-safe via pipeline reversa.

Constatou-se:
1. **Estabilidade na Listagem (`listLocalBackups`)**: Foi validado localmente a correta recuperação de arquivos com extensão `.enc`.
2. **Resiliência Anti-OOM no Restore**: A mecânica reversa utiliza leitura blocada nativa (tamanho derivado no formato e 4-byte headers) acoplada com `nimcrypto` e `zippy`, passando os resultados para o STDIN utilitários como `psql`, consumindo memória *O(1)* independentemente do tamanho final.
3. **Comunicação por Threads (TUI Notifier)**: Confirmado o uso de Channels reportando `mkLog` à thread principal a cada dezenas de blocos transacionados, viabilizando barras de progresso suaves sem congelar a Tatuí.
4. **Verificação de Regras de Negócio**: Utilização do schema `public` está rigorosamente proibida no código (lança `ValueError`).

O pacote de testes automatizados (`nimble test trestore`) executa cenários simulados comprovando a robustez dos exit codes e o redirecionamento dos fluxos sem perdas.

---

## 2. Cenários de Teste (Gherkin)

**Feature:** Restore Engine Anti-OOM

  **Scenario:** Sucesso no Restore Integral (Happy Path)
    **Given** que existem arquivos de backup válidos no diretório `~/.cambalhota/db_dumps/2026/`
    **And** o usuário configura a conexão informando um schema válido (diferente de `public`)
    **When** o processo de restore é iniciado para o arquivo escolhido
    **Then** o worker irá ler o arquivo por fluxo contínuo
    **And** o dado descriptografado e descomprimido será canalizado com sucesso para o `stdin` da CLI (`psql`, `mysql`, etc)
    **And** a Thread TUI receberá relatórios contínuos sobre os bytes processados
    **And** o status final será sucesso (QA Aprovado).

  **Scenario:** Restauração interrompida por schema inválido (Semântico)
    **Given** que o usuário tente configurar o restore para o banco de dados
    **When** define o campo schema explicitamente como "public"
    **Then** o worker de validação deve lançar um erro imediatamente
    **And** o SGBD subjacente não será invocado
    **And** o painel TUI deverá notificar que "Uso do schema public é proibido".

  **Scenario:** Ferramenta do SGBD ausente no SO
    **Given** que o sistema operacional não possui o utilitário nativo (`psql` ou `mysql`)
    **When** o worker tenta invocar `osproc.startProcess`
    **Then** um erro (como Arquivo não encontrado) deve ser capturado 
    **And** encapsulado em uma mensagem de Erro no `logChannel` de maneira controlada, sem causar Segmentation Fault na TUI.

  **Scenario:** Falha de Exit Code do SGBD (Erro no Banco)
    **Given** que a extração iniciou o dump
    **When** a CLI do banco de dados (ex: `psql`) retornar Exit Code diferente de 0 (devido a restrições de permissão do DB)
    **Then** o pipeline de restore reporta o evento como Falha
    **And** envia `mkError` contendo "Restore process exited with code X" à TUI.

  **Scenario:** Corrupção no Arquivo `.enc` e Quebra de Bloco (Edge Case)
    **Given** um backup modificado ou truncado manualmente no diretório local
    **When** o Restore Engine ler os cabeçalhos de bloco (`len`) e requisitar bytes 
    **Then** a engine notará uma leitura inferior à declarada
    **And** falhará com erro semântico "Arquivo corrompido, bloco incompleto".

---

## 3. Conclusões e Certificação

O Épico 3 atende integralmente à especificação de produto e à engenharia técnica delineada:
- A leitura orientada a blocos provou sua segurança contra Out of Memory.
- Os retornos via `logChannel` alimentam a interface de modo Thread-safe.
- Exit codes e comportamentos anômalos de leitura (EOF e block-length) foram traduzidos para feedback visual ao usuário, cumprindo a promessa fail-safe.

*Assinado pelo Agente QA*
