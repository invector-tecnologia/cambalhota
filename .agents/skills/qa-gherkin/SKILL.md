---
name: qa-gherkin
description: >
  Gera planos de teste em formato Gherkin (.feature) em português para o projeto tavolo.
  Ativar quando o agente qa precisar criar cenários de teste, validar implementações
  ou gerar planos de teste exploratórios.
---

# QA Gherkin

## Visão Geral

Esta skill gera planos de teste em formato Gherkin (`.feature`) escritos em português (pt-BR) para o projeto tavolo. Os planos cobrem cenários de caminho feliz, casos de borda, cenários de erro, isolamento multi-tenant e controle de acesso baseado em roles. Cada plano de teste é vinculado a um ADR aceito e serve como especificação executável para validação da implementação.

## Quando Usar

- Após um ADR ser aceito e o código correspondente estar implementado (ou em implementação).
- Ao validar que uma funcionalidade atende aos critérios de aceitação definidos.
- Ao gerar planos de teste exploratórios para funcionalidades existentes.
- Ao verificar isolamento de dados entre tenants.
- Ao validar que a hierarquia de permissões está corretamente aplicada.
- Ao documentar regressões identificadas durante revisão de código.

## Idioma

Todos os arquivos `.feature` devem iniciar com o cabeçalho de idioma:

```gherkin
# language: pt
```

Isso garante que os parsers Gherkin interpretem as palavras-chave em português:
- `Funcionalidade` (Feature)
- `Contexto` (Background)
- `Cenário` (Scenario)
- `Esquema do Cenário` (Scenario Outline)
- `Exemplos` (Examples)
- `Dado` / `Dados` (Given)
- `Quando` (When)
- `Então` (Then)
- `E` (And)
- `Mas` (But)

## Requisitos de Cobertura

Todo plano de teste deve incluir, no mínimo:

| Tipo de Cenário | Quantidade Mínima | Descrição |
|-----------------|-------------------|-----------|
| Caminho feliz (happy path) | 1 | Fluxo principal com dados válidos |
| Casos de borda (edge cases) | 2 | Limites, valores extremos, entradas atípicas |
| Cenário de erro | 1 | Entradas inválidas, falhas esperadas, mensagens de erro |
| Isolamento multi-tenant | 1 | Verificação de que dados de um tenant não vazam para outro |

Cenários adicionais recomendados (não obrigatórios):
- Cenários de concorrência (operações simultâneas no mesmo recurso).
- Cenários de idempotência (repetição da mesma operação).
- Cenários de performance (limites de tempo de resposta).

## Template do Arquivo .feature

```gherkin
# language: pt

Funcionalidade: Título descritivo da funcionalidade
  Como um <role>
  Eu quero <ação>
  Para que <benefício>

  Contexto:
    Dado que o sistema está operacional
    E que existe um tenant "Clínica Exemplo" cadastrado

  # --- Caminho Feliz ---

  Cenário: Descrição do cenário de sucesso
    Dado que o usuário "<role>" está autenticado no tenant "Clínica Exemplo"
    E que <pré-condição>
    Quando <ação do usuário>
    Então <resultado esperado>
    E <verificação adicional>

  # --- Casos de Borda ---

  Cenário: Descrição do caso de borda 1
    Dado que <contexto do caso de borda>
    Quando <ação>
    Então <resultado esperado>

  Cenário: Descrição do caso de borda 2
    Dado que <contexto do caso de borda>
    Quando <ação>
    Então <resultado esperado>

  # --- Cenário de Erro ---

  Cenário: Descrição do cenário de erro
    Dado que <contexto>
    Quando <ação inválida>
    Então o sistema deve retornar um erro
    E a mensagem deve indicar o motivo da falha

  # --- Isolamento Multi-Tenant ---

  Cenário: Dados de um tenant não são visíveis para outro tenant
    Dado que existe um tenant "Clínica A" com dados cadastrados
    E que existe um tenant "Clínica B" com dados cadastrados
    Quando o usuário do tenant "Clínica B" consulta os dados
    Então os dados do tenant "Clínica A" não devem ser retornados
    E apenas os dados do tenant "Clínica B" devem ser visíveis
```

## Convenção de Nomenclatura

Os arquivos `.feature` devem seguir o padrão:

```
NNN_nome_do_adr.feature
```

- **NNN**: número correspondente ao ADR que originou a funcionalidade.
- **nome_do_adr**: mesmo nome usado no ADR correspondente, em snake_case, sem acentos.

### Exemplos

| ADR | Arquivo .feature |
|-----|-----------------|
| `001_autenticacao_jwt.md` | `001_autenticacao_jwt.feature` |
| `002_estrategia_multi_tenant.md` | `002_estrategia_multi_tenant.feature` |
| `003_migracao_banco_dados.md` | `003_migracao_banco_dados.feature` |

## Localização

Todos os planos de teste devem ser armazenados em:

```
docs/engineering/qa_plans/
```

Não crie subdiretórios dentro desta pasta. Todos os arquivos `.feature` residem no mesmo nível.

## Validação Semântica

Prefira asserções contextuais em vez de correspondência exata de texto. Isso torna os testes mais resilientes a mudanças de UI e internacionalização.

### ❌ Evitar — correspondência exata

```gherkin
Então a mensagem exibida deve ser "Animal cadastrado com sucesso!"
```

### ✅ Preferir — asserção contextual

```gherkin
Então o sistema deve confirmar o cadastro do animal
E o animal deve constar na lista de animais do tenant
```

### Diretrizes

- Use asserções que validem **comportamento** e **estado**, não textos literais.
- Verifique **efeitos colaterais** (registros no banco, eventos emitidos) quando relevante.
- Valide **ausência de dados** em cenários de isolamento multi-tenant (ex.: "não devem ser retornados").
- Valide **códigos de status HTTP** em cenários de API quando aplicável (ex.: "o sistema deve retornar status 403").

## Cenários Baseados em Roles

Cada plano de teste deve considerar a hierarquia de roles do tavolo e incluir cenários que validem o controle de acesso. A hierarquia é:

```
superadmin > admin > coordenador > voluntário > tavoloário > visualização
```

### Tipos de cenários por role

| Role | Cenários típicos |
|------|-----------------|
| **superadmin** | Acesso total, gerenciamento de tenants, operações cross-tenant |
| **admin** | Gerenciamento de usuários e configurações do tenant |
| **coordenador** | Coordenação de voluntários e agendamentos |
| **voluntário** | Registro de atividades, acompanhamento de animais |
| **tavoloário** | Prontuários, prescrições, procedimentos clínicos |
| **visualização** | Somente leitura, sem permissão de escrita |

### Template para cenário de permissão

```gherkin
  Esquema do Cenário: Acesso à funcionalidade por role
    Dado que o usuário com role "<role>" está autenticado
    Quando o usuário tenta <ação>
    Então o sistema deve <resultado>

    Exemplos:
      | role          | resultado                          |
      | superadmin    | permitir a operação                |
      | admin         | permitir a operação                |
      | coordenador   | permitir a operação                |
      | voluntário    | negar a operação com status 403    |
      | tavoloário   | negar a operação com status 403    |
      | visualização  | negar a operação com status 403    |
```

## Exemplo Completo — Cadastro de Animal

```gherkin
# language: pt

Funcionalidade: Cadastro de animal
  Como um coordenador
  Eu quero cadastrar um novo animal no sistema
  Para que ele possa receber acompanhamento tavoloário

  Contexto:
    Dado que o sistema está operacional
    E que existe um tenant "Clínica Esperança" cadastrado
    E que o schema do banco de dados está configurado via DATABASE_SCHEMA

  # --- Caminho Feliz ---

  Cenário: Cadastrar animal com dados válidos
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    E que os seguintes dados do animal são fornecidos:
      | campo     | valor         |
      | nome      | Rex           |
      | especie   | Canino        |
      | raca      | SRD           |
      | idade     | 3 anos        |
      | peso      | 12.5 kg       |
    Quando o usuário envia a solicitação de cadastro
    Então o sistema deve confirmar o cadastro do animal
    E o animal "Rex" deve constar na lista de animais do tenant "Clínica Esperança"
    E o registro deve conter a data de cadastro atual

  # --- Casos de Borda ---

  Cenário: Cadastrar animal com nome no limite máximo de caracteres
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário cadastra um animal com nome de 255 caracteres
    Então o sistema deve aceitar o cadastro normalmente

  Cenário: Cadastrar animal com peso zero
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário cadastra um animal com peso "0"
    Então o sistema deve rejeitar o cadastro
    E deve indicar que o peso deve ser maior que zero

  # --- Cenário de Erro ---

  Cenário: Cadastrar animal sem campos obrigatórios
    Dado que o usuário "coordenador" está autenticado no tenant "Clínica Esperança"
    Quando o usuário envia a solicitação de cadastro sem o campo "nome"
    Então o sistema deve retornar um erro de validação
    E deve indicar que o campo "nome" é obrigatório

  # --- Isolamento Multi-Tenant ---

  Cenário: Animais de um tenant não são visíveis para outro tenant
    Dado que o tenant "Clínica Esperança" possui o animal "Rex" cadastrado
    E que o tenant "Pet Saúde" possui o animal "Luna" cadastrado
    Quando o usuário "coordenador" do tenant "Pet Saúde" lista os animais
    Então o animal "Rex" do tenant "Clínica Esperança" não deve ser retornado
    E apenas o animal "Luna" deve ser visível

  # --- Controle de Acesso por Role ---

  Esquema do Cenário: Permissão de cadastro de animal por role
    Dado que o usuário com role "<role>" está autenticado no tenant "Clínica Esperança"
    Quando o usuário tenta cadastrar um novo animal
    Então o sistema deve <resultado>

    Exemplos:
      | role          | resultado                          |
      | superadmin    | permitir o cadastro                |
      | admin         | permitir o cadastro                |
      | coordenador   | permitir o cadastro                |
      | voluntário    | permitir o cadastro                |
      | tavoloário   | permitir o cadastro                |
      | visualização  | negar o cadastro com status 403    |

  Cenário: Usuário com role visualização não pode editar animal
    Dado que o usuário com role "visualização" está autenticado no tenant "Clínica Esperança"
    E que o animal "Rex" está cadastrado
    Quando o usuário tenta editar os dados do animal "Rex"
    Então o sistema deve negar a operação
    E deve retornar status 403
```
