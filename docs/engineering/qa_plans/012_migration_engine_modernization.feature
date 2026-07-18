# language: pt
Funcionalidade: Modernização do Motor de Migração (Migration Engine)
  Como um usuário da TUI do Cambalhota
  Eu quero gerenciar e executar as migrações de banco de dados a partir de uma aba unificada
  Para que eu não precise de variáveis de ambiente e tenha uma experiência visual consistente e segura

  Contexto:
    Dado que a aplicação TUI principal (`src/tui/app.nim`) está em execução
    E o usuário navegou para a aba "Migrations"

  Cenário: Execução de migração com sucesso (Caminho Feliz)
    Dado que as credenciais do banco de dados estão configuradas no banco SQLite local
    E existem migrações pendentes para o banco de dados
    Quando o usuário solicita a execução das migrações
    Então um Modal de Confirmação Universal (ADR 011) deve ser exibido
    Quando o usuário confirma a operação no modal
    Então a execução da migração deve ser iniciada em uma thread assíncrona
    E o log contínuo da migração deve ser renderizado em tempo real na área `bodyRect`
    E ao finalizar, uma mensagem de sucesso deve ser exibida

  Cenário: Tentativa de migração sem credenciais no banco SQLite
    Dado que o banco SQLite local não possui credenciais de banco de dados configuradas
    Quando o usuário solicita a execução das migrações
    Então um Modal de Erro deve ser exibido informando que as credenciais estão ausentes
    E a migração não deve ser iniciada

  Cenário: Falha de migração com banco corrompido (Edge Case)
    Dado que as credenciais estão corretas no banco SQLite local
    E o usuário confirmou a execução da migração
    E a execução da migração iniciou em uma thread assíncrona
    Quando ocorre uma corrupção do banco de dados ou erro de integridade durante a aplicação dos scripts
    Então a thread assíncrona deve capturar a exceção com segurança
    E a transação da migração deve ser revertida (rollback)
    E o erro detalhado deve ser impresso no log contínuo dentro da área `bodyRect`
    E um Modal de Erro Crítico deve ser exibido informando a falha
    E a TUI principal não deve congelar nem sofrer crash

  Cenário: Cancelamento da migração no Modal de Confirmação
    Dado que o usuário solicitou a execução das migrações
    E o Modal de Confirmação Universal foi exibido
    Quando o usuário escolhe a opção de cancelar
    Então o modal deve ser fechado
    E nenhuma migração deve ser executada
    E a interface deve retornar ao estado anterior na aba "Migrations"
