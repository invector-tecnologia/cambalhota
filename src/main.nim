import core/db
import os, strformat

proc initTUI() =
  # Mock simulando o frontend Tatuí conforme Design System e Scope
  echo "\e[1;36m====================================================\e[0m"
  echo "\e[1;36m|                 CAMBALHOTA TUI                   |\e[0m"
  echo "\e[1;36m====================================================\e[0m"
  echo "\e[32m[Info]\e[0m Interface Tatuí Inicializada (Dark Mode Ativo)"
  echo "\e[32m[Info]\e[0m Tema: Monoid 13px | Highlights: #88C0D0"
  echo "----------------------------------------------------\n"

proc main() =
  initTUI()

  if paramCount() < 1:
    echo "\e[31m[Erro]\e[0m Argumentos insuficientes. Comandos disponíveis:"
    echo "  cambalhota backup <schema>"
    echo "  cambalhota restore <schema> <arquivo_sql>"
    echo "  cambalhota list-backups"
    quit(1)
    
  let action = paramStr(1)
  
  # Leitura de credenciais de forma segura via variáveis de ambiente (Zero-Trust)
  let dbHost = getEnv("DB_HOST", "localhost")
  let dbPort = getEnv("DB_PORT", "5432")
  let dbUser = getEnv("DB_USER", "postgres")
  let dbName = getEnv("DB_NAME", "postgres")
  
  # CDN ou Repo Git montado/disponível localmente
  let cdnMount = getEnv("CDN_MOUNT_PATH", "./dumps")
  
  if action == "backup":
    if paramCount() < 2:
      echo "\e[31m[Erro]\e[0m Informe o nome do schema para extração."
      quit(1)
    
    let schema = paramStr(2)
    echo fmt"\e[36m[Ação]\e[0m Iniciando backup do schema '{schema}' do BD '{dbName}'..."
    
    try:
      let savedPath = extractSchema(dbHost, dbPort, dbUser, dbName, schema, cdnMount)
      echo fmt"\e[32m[Sucesso]\e[0m Backup estrutural/dados concluído!"
      echo fmt"  -> Persistido no Git/CDN em: {savedPath}"
    except Exception as e:
      echo "\e[31m[Falha Fatal]\e[0m ", e.msg
      quit(1)
      
  elif action == "restore":
    if paramCount() < 3:
      echo "\e[31m[Erro]\e[0m Informe o schema e o caminho do arquivo de backup no Git/CDN."
      quit(1)
      
    let schema = paramStr(2)
    let filePath = paramStr(3)
    echo fmt"\e[36m[Ação]\e[0m Iniciando restauração do schema '{schema}' usando '{filePath}'..."
    
    try:
      if restoreSchema(dbHost, dbPort, dbUser, dbName, filePath):
        echo fmt"\e[32m[Sucesso]\e[0m Restauração (Restore) aplicada 100% no banco de dados."
    except Exception as e:
      echo "\e[31m[Falha Fatal]\e[0m ", e.msg
      quit(1)
      
  elif action == "list-backups":
    echo fmt"\e[36m[Ação]\e[0m Listando backups disponíveis em '{cdnMount}'..."
    let backups = listBackups(cdnMount)
    if backups.len == 0:
      echo "\e[33m[Aviso]\e[0m Nenhum backup encontrado na CDN."
    else:
      for b in backups:
        echo fmt"  - {b}"
      
  else:
    echo fmt"\e[31m[Erro]\e[0m Ação '{action}' desconhecida na CLI do Cambalhota."

when isMainModule:
  main()
