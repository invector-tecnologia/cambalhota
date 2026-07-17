Feature: Core de Conexão e Extração (Backup)
  Como um DBA ou sysadmin utilizando o Cambalhota
  Eu quero que o sistema valide as dependências locais (como o pg_dump) e se conecte utilizando schemas seguros
  Para garantir um processo de extração transparente, fail-safe e livre de impactos no banco de dados.

  Scenario: Validação bem-sucedida das dependências do sistema (Happy Path)
    Given que a aplicação Cambalhota é inicializada
    And o utilitário "pg_dump" está instalado e disponível no PATH do sistema operacional
    When o sistema executa o pre-flight check de dependências
    Then o pre-flight check deve ser bem-sucedido
    And nenhuma exceção deve ser levantada
    And o sistema deve permitir o prosseguimento da execução

  Scenario: Utilitário pg_dump não encontrado no sistema (Error Case)
    Given que a aplicação Cambalhota é inicializada
    And o utilitário "pg_dump" NÃO está disponível no PATH do sistema operacional
    When o sistema executa o pre-flight check de dependências
    Then o pre-flight check deve falhar
    And o sistema deve registrar um erro semântico amigável avisando sobre a ausência do utilitário
    And o sistema deve adotar uma postura fail-safe e prevenir qualquer tentativa de dump que pudesse causar crash em runtime

  Scenario: Inicialização da configuração default do PostgreSQL usando schema Cambalhota (Happy Path)
    Given a configuração de inicialização do PostgreSQL
    When o sistema cria a instância padrão de `PgConfig`
    Then o schema alvo interno de uso deve ser estritamente "Cambalhota"
    And o schema alvo não deve ser "public"
    And a configuração de sslMode deve ser "require"

  Scenario: Sobrescrita explícita de schema e opções (Edge Case)
    Given a configuração de inicialização do PostgreSQL
    When o usuário sobreescreve intencionalmente as opções via construtor customizado de PgConfig para usar um schema diferente de "Cambalhota"
    Then o sistema deve honrar a substituição para atender as razões válidas
    But deve manter os parâmetros de conexão essenciais consistentes
