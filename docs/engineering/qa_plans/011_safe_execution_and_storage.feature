# language: pt
Funcionalidade: Execução Segura e Armazenamento
  Como um usuário do Cambalhota
  Eu quero que meus backups de banco de dados sejam executados de forma segura, confirmados e armazenados corretamente
  Para que eu não perca dados acidentalmente, não quebre a renderização do terminal ou perca arquivos.

  Contexto:
    Dado que a TUI do Cambalhota está em execução
    E o aplicativo tem permissão de escrita em "~/.cambalhota/db_dump/"

  Cenário: Cancelando uma ação crítica via modal de confirmação
    Dado que o usuário inicia uma ação de "Backup", "Restore" ou "Exclusão"
    E o Modal Universal de Confirmação é exibido na tela
    Quando o usuário pressiona a tecla "[Esc]"
    Então o modal deve ser fechado
    E a ação deve ser abortada imediatamente
    E nenhum arquivo de backup deve ser criado ou alterado em "~/.cambalhota/db_dump/"
    E o estado de renderização do terminal deve permanecer intacto sem corrupção visual

  Cenário: Execução bem-sucedida de backup com armazenamento particionado por ano
    Dado que o usuário inicia uma ação de "Backup"
    E o Modal Universal de Confirmação é exibido na tela
    Quando o usuário confirma a ação
    E o subprocesso de backup é executado
    Então o stdout do subprocesso deve ser interceptado de forma assíncrona
    E as mensagens interceptadas devem ser enviadas e exibidas no "logChannel" (Console na TUI)
    E um arquivo físico de backup deve ser salvo com sucesso
    E o arquivo deve estar localizado exatamente na subpasta do ano correspondente, no formato "~/.cambalhota/db_dump/YYYY/"
    E o estado de renderização do terminal deve ser mantido durante e após a execução

  Cenário: Execução de Restore ou Exclusão não quebra a interface
    Dado que o usuário inicia uma ação de "Restore"
    E o Modal Universal de Confirmação é exibido na tela
    Quando o usuário confirma a ação
    Então a ação correspondente deve ser executada
    E o stdout do subprocesso deve ser interceptado e exibido no "logChannel"
    E a interface do terminal não deve perder seu estado de renderização em nenhum momento
