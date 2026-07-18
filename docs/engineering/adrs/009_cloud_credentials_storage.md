# 009 - Storage Flexível e Seguro de Credenciais Cloud

## Contexto

O usuário aprovou o fluxo de UX para gerenciamento de configurações de provedores Cloud no Cambalhota. A arquitetura precisa suportar uma lista crescente e heterogênea de provedores, como AWS, MinIO, R2, Git, Google Drive, Dropbox, OneDrive e Apple Cloud. Cada provedor possui mecanismos de autenticação distintos: provedores S3-like exigem *Access Keys*, enquanto provedores baseados em drives virtuais ou Git geralmente utilizam *OAuth Tokens* ou chaves SSH/PATs. Adicionalmente, essas credenciais são altamente sensíveis e devem ser persistidas no ambiente local de forma unificada e segura.

## Decisão

1.  **Tabela `cloud_providers` no SQLite Local:**
    Adicionar uma nova entidade ao banco SQLite existente (`connections.db`) dedicada a mapear e armazenar as configurações dos provedores de backup/cloud.
    *Schema sugerido:*
    - `id` (UUID): Chave primária.
    - `name` (String): Nome amigável definido pelo usuário para identificar a configuração.
    - `provider_type` (String): O tipo/engine do provedor (ex: `aws`, `minio`, `git`, `google_drive`, etc).
    - `encrypted_credentials` (Blob/Text): O payload contendo a credencial estruturada, criptografada *at rest*.
    - `metadata` (Text): Um JSON estruturado com dados não sensíveis do provedor (ex: `bucket_name`, `region`, `endpoint_url`, `repository_url`).
    - `created_at` / `updated_at`: Controle de auditoria.

2.  **Flexibilidade do Payload via JSON:**
    Tanto o campo de `metadata` quanto o dado original que compõe as credenciais serão objetos JSON. Isso absorve a heterogeneidade das autenticações sem forçar alterações constantes no DDL do SQLite quando um novo provedor for adicionado.
    - *Exemplo de S3:* `{"access_key_id": "...", "secret_access_key": "..."}`
    - *Exemplo de OAuth:* `{"access_token": "...", "refresh_token": "...", "client_id": "...", "expiry": "..."}`
    - *Exemplo de Git:* `{"ssh_private_key": "..."}` ou `{"personal_access_token": "..."}`

3.  **Segurança (Criptografia Simétrica):**
    Antes de salvar o payload JSON em `encrypted_credentials`, o `ConfigManager` serializará e criptografará a string completa em AES-256-GCM. 
    Seguindo o design estabelecido nas conexões de banco de dados locais, a **Master Key** (chave de criptografia) não será armazenada no SQLite, mas delegada ao **OS Keyring** nativo da máquina do usuário (Keychain no macOS, Secret Service no Linux, Credential Locker no Windows).

## Trade-offs

-   **Prós:** A modelagem baseada em JSON provê máxima extensibilidade para suportar futuramente dezenas de clouds sem quebrar a consistência das tabelas. Criptografar o JSON como um payload único é computacionalmente rápido e simplifica a camada de persistência em Nim.
-   **Contras:** Não é possível buscar, indexar ou realizar restrições SQL granulares diretamente nos campos internos das credenciais ou dos metadados (já que o principal está encriptado e o secundário é um BLOB/String JSON). Entende-se, porém, que as consultas no Core Engine sempre farão a busca por `id` ou `provider_type`, mitigando completamente esse problema e tornando o trade-off altamente favorável.

## Consequências

-   A camada de Acesso a Dados (DAO) em Nim deverá ser estendida para suportar operações de CRUD focadas na nova tabela `cloud_providers`.
-   As lógicas de (de)serialização da `std/json` deverão ser integradas aos fluxos da `nimcrypto` antes do flush do dado na base local para o gerenciamento correto da tabela e resgate *on-the-fly* via Worker Thread.
-   O mapa arquitetural (e o `ConfigManager`) assume a responsabilidade de ser o orquestrador não só de credenciais SGBD, mas agora de Nuvem/Repositório de longo prazo.
