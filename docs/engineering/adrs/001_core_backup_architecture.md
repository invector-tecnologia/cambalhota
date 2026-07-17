# ADR-001: Arquitetura Core de Conexão e Extração (Backup)

- **Status:** Implementado
- **Data:** 2026-07-17

## Contexto
O projeto **Cambalhota** tem como premissa central o gerenciamento de backups e restaurações de schemas de banco de dados de maneira totalmente *fail-safe* (objetiva, transparente e segura). Para os Épicos 1 (Configuração e Conexão) e 2 (Extração e Persistência), precisamos definir a tecnologia base e a arquitetura pela qual a aplicação, rodando via Terminal User Interface (TUI), se comunicará de forma segura com o PostgreSQL alvo, extrairá os dados e fará o envio para armazenamento remoto seguro (CDN/S3-compatible). O sistema não pode interromper ou degradar a performance do banco durante a extração, especialmente em horários de pico.

## Decisão Técnica
1. **Linguagem Base e TUI:** A aplicação será construída inteiramente em **Nim**, utilizando a biblioteca **Tatuí** para a interface de terminal. O Nim foi escolhido por gerar binários nativos, rápidos, com baixo consumo de memória (overhead mínimo) e por ser estaticamente tipado, garantindo segurança em runtime.
2. **Conexão Segura:** Utilizaremos drivers nativos em Nim para conexão via protocolo PostgreSQL (TCP/IP), com suporte obrigatório a SSL/TLS para proteção dos dados em trânsito.
3. **Extração de Dados (Backup):** A extração não será feita por *selects* manuais no código Nim (que seriam lentos e consumiriam muita memória da aplicação). O Cambalhota orquestrará a execução da ferramenta nativa `pg_dump` via `os.execProcess` (ou equivalente seguro), transmitindo o binário resultante via *streams* (para não estourar a RAM) diretamente para o destino.
4. **Persistência Remota:** Os *streams* originados pela extração serão criptografados em trânsito e enviados em chunks para o repositório remoto (ex: API compatível com S3) utilizando requisições HTTP seguras assíncronas.

## Trade-offs Considerados
- **Implementar o dump na própria linguagem vs Usar `pg_dump`:** 
  - *Fazer via Nim:* Daria mais controle sobre as estruturas granulares, mas o custo de desenvolvimento, manutenção e consumo de memória (carregar dados para a RAM para depois salvar) é altíssimo.
  - *Usar `pg_dump`:* Perde-se a granularidade fina de interceptar linha a linha nativamente na linguagem, mas ganha-se a estabilidade, compressão e eficiência testada há décadas do utilitário oficial do PostgreSQL. **Decisão:** `pg_dump`.
- **Binário único vs Scripting (Python/Bash):** A distribuição de uma aplicação TUI interativa para sysadmins/DBAs em Bash ou Python exigiria setup complexo de dependências. Compilando com Nim, fornecemos um binário estático e pronto para execução (*standalone*).

## Consequências
- **Positivas:** O binário gerado pelo Nim será leve e extremamente rápido. O uso do `pg_dump` garantirá backups nativamente consistentes sem sobrecarga absurda da aplicação. A TUI via Tatuí permitirá interações fluídas, passando uma sensação imediata de "operação transparente e fail-safe".
- **Negativas/Desafios:** O sistema operacional onde o Cambalhota rodará precisará ter o binário do `pg_dump` (cliente PostgreSQL) instalado e acessível no PATH do usuário. Precisaremos implementar validações severas de sistema (ex: verificar presença do `pg_dump` e da sua versão) logo na inicialização da aplicação (Pre-flight checks).

## Referências
- Documentação do Nim: https://nim-lang.org/
- Biblioteca Tatuí: Framework TUI adotado para a visão objetiva.
- Features Map & Roadmap v1.0 (Épicos 1 e 2).
