# language: pt

Funcionalidade: Gerenciamento Seguro de Credenciais Cloud
  Como um usuário do Cambalhota
  Eu quero gerenciar minhas credenciais de provedores Cloud pela TUI
  Para que o sistema possa acessar meus provedores (S3, Git, OAuth, etc.) de forma segura, com armazenamento flexível e encriptado

  Cenário: [Caminho Feliz] Criação de um novo provedor S3 com sucesso pela TUI
    Dado que eu estou na TUI de gerenciamento de "Provedores Cloud"
    Quando eu escolho adicionar um novo provedor do tipo "s3"
    E preencho o nome com "Meu Bucket AWS"
    E preencho os metadados com as informações da região e bucket
    E preencho as credenciais com "Access Key" e "Secret Key"
    E salvo a configuração
    Então a TUI exibe uma mensagem de sucesso
    E o registro "Meu Bucket AWS" é persistido na tabela "cloud_providers" do banco "connections.db"
    E o JSON no campo "encrypted_credentials" deve estar criptografado (AES-256-GCM) e não legível no banco
    E a Master Key usada não é salva no SQLite, mas delegada ao OS Keyring

  Cenário: [Caminho Feliz] Leitura e Visualização de um provedor Cloud na TUI
    Dado que existe um provedor "Google Drive" do tipo "oauth" com credenciais salvas no SQLite
    Quando eu acesso a lista de provedores na TUI e seleciono "Google Drive"
    Então o sistema descriptografa o JSON de credenciais transparentemente via Master Key do OS Keyring
    E a TUI exibe os metadados e informações não sensíveis do provedor (sem expor as senhas ou tokens diretamente em texto claro)

  Cenário: [Caminho Feliz] Atualização das credenciais de um provedor Cloud na TUI
    Dado que existe um provedor "Git Backup" do tipo "git"
    Quando eu opto por atualizar o "Personal Access Token" desse provedor pela TUI
    E insiro a nova credencial válida
    E confirmo as alterações
    Então o ConfigManager criptografa o novo token em JSON 
    E atualiza o campo "encrypted_credentials" no banco sem alterar a chave primária
    E a TUI exibe sucesso na atualização

  Cenário: [Caminho Feliz] Exclusão de um provedor Cloud pela TUI
    Dado que existe um provedor "MinIO Backup" salvo na base de dados
    Quando eu excluo o provedor "MinIO Backup" na TUI
    E confirmo a exclusão definitiva
    Então o registro é completamente removido da tabela "cloud_providers"
    E a lista de provedores na TUI não contém mais este item

  Cenário: [Erro] Falha de leitura devido a JSON de credenciais corrompido
    Dado que os dados da coluna "encrypted_credentials" ou "metadata" de um provedor foram corrompidos no SQLite local
    Quando o sistema (ConfigManager) tentar carregar ou o usuário tentar visualizar as credenciais desse provedor
    Então a desencriptação AES-256-GCM ou a deserialização da std/json falhará
    E o sistema não deve sofrer um crash fatal
    E a TUI deve alertar o usuário que "As credenciais do provedor estão corrompidas ou violadas. Por favor, configure novamente."

  Cenário: [Alternativo] Tentativa de criar provedor sem os metadados obrigatórios do provedor específico
    Dado que eu estou adicionando um provedor do tipo "s3"
    Quando eu deixo o JSON de "metadata" incompleto (ex: faltando a "region" ou "endpoint_url")
    E preencho as credenciais corretamente
    E tento salvar
    Então a TUI não permite a gravação
    E sinaliza que faltam parâmetros obrigatórios de metadados para este tipo de provedor.
