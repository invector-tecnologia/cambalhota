# 📦 Release Notes - Cambalhota v1.0.2

Esta atualização traz um grande foco em **Quality of Life (QoL)**, entregando uma interface de terminal ainda mais amigável, fluxos otimizados e maior segurança estrutural em eventos de sistema.

## ✨ Novidades e Melhorias de UX (QoL)

- **Histórico de Restore (Audit Log):** Uma nova aba (`4. History`) foi adicionada. Agora o Cambalhota rastreia e exibe todo o histórico de backups restaurados, relatando com precisão quando foi restaurado, o arquivo de origem, em qual motor de banco e qual o schema de destino.
- **Guia Rápido Dinâmico (Sidebar):** Adicionada uma barra lateral interativa à direita da interface. Ela exibe tutoriais e atalhos úteis dependendo do menu ativo, facilitando muito o uso para novos usuários sem a necessidade de consultar manuais externos.
- **Gestão Ágil de Conexões:** O menu de Configuração (Menu 1) foi sobrecarregado com produtividade:
  - `[E]` **(Edit):** Agora é possível editar os dados de uma conexão existente.
  - `[C]` **(Clone):** Novo recurso para duplicar uma configuração existente, ideal para cadastrar rapidamente um novo Schema sem precisar redigitar host/user/senha.
- **Interface de Digitação Visível:** Os formulários da TUI (como a inserção de banco de dados) agora exibem um cursor de digitação retro/hacker (`█`). Isso fornece feedback tátil de onde a sua entrada de teclado está agindo.
- **Escapamento e Cancelamentos:** O suporte a `ESC` e `Ctrl+C` durante formulários foi reforçado, abortando edições com segurança sem prender o estado do usuário.
- **Detalhes de Conexões Mais Claros:** A listagem foi redesenhada para evidenciar, à primeira vista, de qual tipo de banco estamos falando. As tags `[PG]`, `[MYSQL]`, `[SQLITE]` etc., acompanham o nome do DB e o Schema para não deixar margens a erros durante um Restore crítico.

## 🐛 Correções de Bugs (Bug Fixes)

- **Correção Crítica (Terminal Resize Crash):** Resolvido um problema onde a alteração do tamanho da janela do terminal disparava um fechamento repentino do Cambalhota.
  - *Detalhes técnicos:* O redimensionamento do terminal emite o sinal nativo `SIGWINCH`, que interrompe imediatamente chamadas de sistema IO (`fwrite/fflush`) em processamento. O evento resultava em `EINTR`, que a stack transbordava como `IOError`. Implementamos um colete à prova de falhas (`try...except`) no renderizador principal, permitindo que a UI absorva o tranco e redesenhe os buffers instantaneamente após a queda do sinal.

## 🤖 Operacional

- **Organização da Bateria de Testes:** Instruímos nossos agentes de QA para consolidar e gerar arquivos de testes (.nim) nativamente centralizados e operacionais a partir da pasta `/tests/`, refinando o pipeline e deixando o repositório principal sempre limpo.
