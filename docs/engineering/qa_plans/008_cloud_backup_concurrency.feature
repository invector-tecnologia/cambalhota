# language: pt

Funcionalidade: Sincronização Assíncrona de Backups na Nuvem (S3)
  Como um usuário do Cambalhota
  Eu quero enviar (upload) e baixar (download) arquivos de backup para a nuvem de forma assíncrona
  Para que a interface gráfica do terminal (TUI) não congele durante operações de rede (I/O pesadas)

  Cenário: Upload assíncrono de backup com sucesso (Caminho Feliz)
    Dado que o usuário configurou credenciais S3 válidas
    E existe um arquivo de backup local válido
    Quando o usuário aciona o comando de Upload na TUI "[U]"
    Então o sistema deve iniciar uma Worker Thread para a transferência HTTP Streaming
    E a TUI deve continuar rodando (renderização não bloqueada)
    E o sistema deve atualizar o progresso (bytes enviados/total) através do Channel comunicando com a thread principal
    E ao final da transferência, a TUI deve exibir "Upload concluído com sucesso"
    E o arquivo correspondente deve constar no bucket S3

  Cenário: Download assíncrono de backup com sucesso (Caminho Feliz)
    Dado que o usuário configurou credenciais S3 válidas
    E existe um arquivo de backup válido no bucket S3 remoto
    Quando o usuário aciona o comando de Download na TUI "[D]"
    Então o sistema deve iniciar uma Worker Thread para realizar a operação
    E a TUI deve continuar responsiva permitindo navegação
    E o progresso do download deve ser atualizado em tempo real na TUI via mensagens do Channel (`tryRecv`)
    E ao final da operação, a TUI deve exibir "Download concluído com sucesso"
    E o arquivo baixado deve estar íntegro no disco local

  Cenário: Tratamento de falha de rede durante transferência (Edge Case / Caminho de Erro)
    Dado que o usuário iniciou um Upload ou Download de backup
    Mas ocorre uma queda abrupta de conexão de rede durante a transferência de um chunk
    Então a Worker Thread deve capturar a exceção ou falha de timeout
    E enviar uma mensagem de erro (`stError`) pelo Channel de volta para a thread principal
    E a TUI deve notificar o usuário com "Erro de conexão de rede"
    E a TUI não deve sofrer congelamento ou falha fatal (crash) durante o timeout da rede

  Cenário: Uso de chaves S3 inválidas (Edge Case / Caminho de Erro)
    Dado que o usuário configurou credenciais ou chaves S3 (AWS Signature V4) inválidas
    Quando o usuário aciona uma operação na nuvem (Upload ou Download)
    Então o serviço remoto deve rejeitar a requisição HTTP (ex: 403 Forbidden)
    E a Worker Thread deve capturar esse retorno de erro
    E notificar a thread principal da TUI via Channel
    E a TUI deve exibir a mensagem "Erro de autenticação: Verifique suas credenciais S3"
    E a TUI deve permanecer responsiva

  Cenário: Validação de Isolamento de Thread - TUI sem congelamento (Validação Técnica)
    Dado que um Upload de um backup grande (ex: 1 GB) está em progresso
    Quando o usuário realizar interações na TUI como navegação, redimensionamento ou pressionar teclas
    Então a interface deve continuar renderizando a no mínimo 60fps
    E não deve ocorrer atraso no input lag provocado pela comunicação de rede (isolamento de thread funcional)
    
  Cenário: Cancelamento de um envio em andamento (Caminho Alternativo)
    Dado que o usuário iniciou um Upload ou Download
    E a transferência ainda está em andamento (ex: 50%)
    Quando o usuário pressionar um comando para cancelar a operação
    Então a thread principal da TUI deve sinalizar a Worker Thread de rede (via boolean atômico ou token de cancelamento)
    E a Worker Thread deve abortar o chunk atual e encerrar a conexão graciosamente
    E a TUI deve informar "Operação cancelada pelo usuário" sem travar
