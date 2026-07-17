<div align="center">
  <h1>🤸‍♂️ Cambalhota</h1>
  <h3>The Retrowave Database Swiss Army Knife</h3>
  <p>Controle de versão de banco de dados nativo, ultra-rápido, criptografado e orientado à interface de terminal (TUI).</p>
</div>

<br />

O **Cambalhota** não é apenas mais um gerenciador de banco de dados; é uma plataforma completa construída em **Nim** que abstrai o caos do gerenciamento de *dumps*, *restores* e *migrations*. Ele foca em segurança local em estado de repouso (at-rest), tolerância a gargalos de RAM e uma experiência visual *Retrowave* direto no seu terminal.

## 🌟 Principais Features (v1.0)

### 1. 🛡️ Segurança Local-First (Epic 7)
Nunca mais deixe um dump legível na sua máquina. O Cambalhota exporta e salva arquivos localmente na pasta `~/.cambalhota/db_dumps/YYYY/`.
Antes de tocar no disco, todo byte é comprimido *on-the-fly* via **Zippy** e blindado em criptografia de nível militar **AES-256 CTR** utilizando `nimcrypto`. Seus dados em repouso estão 100% protegidos contra extrações indevidas.

### 2. 🌊 Restore Engine & Mecânica Reversa Anti-OOM (Epic 3)
Fazer o restore de um banco de centenas de gigabytes não precisa congelar sua máquina.
O Cambalhota opera com injeção direta de blocos (`stdin`) consumindo pouquíssima RAM (*O(1)*). Ele decripta os blocos, infla e encaminha a saída limpa de forma ininterrupta para CLIs como `psql` e `mysql`, enquanto reporta os *Megabytes* injetados. Além disso, regras estritas impedem a injeção acidental por cima do schema `public` (Fail-Safe Ativo).

### 3. 📜 Migration Engine Transacional (Epic 4)
O núcleo do Cambalhota atua de maneira semelhante ao *Flyway* ou *Liquibase*, validando scripts de migração (`up/down` com padrão de nomenclatura `VYYYYMMDDHHMM__slug.sql`):
- **Checksumming (SHA-256):** O motor valida a integridade lógica comparando o HASH do arquivo atual contra a tabela local (`Cambalhota.cambalhota_schema_history`). Se uma vírgula foi alterada num arquivo já aplicado, o processo sofre abordo total.
- **Isolamento Transacional:** Todo script executado no seu banco de dados é automaticamente envelopado por um invólucro de `BEGIN` e `COMMIT`. Se um erro sintático ocorrer na linha 40, o script inteiro sofre Rollback e a consistência do SGBD é mantida (nas engines suportadas).

### 4. 📺 Tatuí TUI (Epic 5)
Chega de olhar para telas de log subindo descontroladamente ou congeladas. O *Cambalhota* implementa a biblioteca **Tatuí** para te dar um ambiente Multithread responsivo:
- Abas e painéis isolados de configurações, backups locais, histórico e File Viewer.
- Navegue nos seus scripts locais, leia todo o código na TUI e aplique suas migrações apertando `Enter`. 
- Log não-bloqueante via *Channels*, provendo barras de progresso contínuas e imunes ao peso do processamento I/O do disco/banco.

---

## 🚀 Instalação (One-Liner)

Se você já quer saltar para a ação e instalar o utilitário nativo na sua máquina, execute:

```bash
curl -sSL https://github.com/invector-tecnologia/tai/releases/download/v1.0.0/install.sh | bash
```

*Nota: O script baixará o binário recém-compilado da nossa página de [Releases](https://github.com/invector-tecnologia/tai/releases) e aplicará a configuração em `/usr/local/bin`.*

---

## 📖 Como Usar (Guia Definitivo)

### 1. Invocando o Motor
Basta chamar `cambalhota` de dentro do diretório do seu projeto onde os seus arquivos de configuração ou a pasta `migrations/up/` habitam.
```bash
cambalhota
```

### 2. Configurações de Banco (Environment)
O Cambalhota respeita rigorosamente variáveis de ambiente. Defina as variáveis antes de subir a ferramenta ou as declare no seu `~/.bashrc`:

```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_NAME="postgres"
export DB_PASS="senha_super_secreta" # Para processos não solicitarem TTY interativa.
```
*(Opcionalmente, você pode usar a interface visual na aba `Config` para sobrescrever os acessos na sessão).*

### 3. Navegação (Keybinds)
- `Esquerda / Direita`: Altera as abas no topo da aplicação (Config -> Backup -> Restore / Migrations).
- `Cima / Baixo`: Seleciona um arquivo listado no painel de *History / Actions*.
- `Enter`: Executa uma ação primária sobre o arquivo (Por exemplo, ler o script SQL e disparar o Motor de Migrações).
- `Ctrl + Q`: Encerra o utilitário graciosamente abortando processos zumbis.

### 4. Estruturando suas Migrações Locais
O motor (Epic 4) escaneia os arquivos SQL em `migrations/up/`. A regra de nomenclatura deve ser seguida para que a ferramenta compreenda a cronologia universal:
```
V20260717164800__create_users_table.up.sql
V20260717170000__add_tenant_id_to_users.up.sql
```
- A letra `V` seguida pelo Timestamp é vital (Garante ordem e *sorting* matemático).
- O caractere duplo `__` separa a versão do slug.

---

## 🛠️ Para Desenvolvedores (Compilando Localmente)
O Cambalhota foi construído integralmente em [Nim](https://nim-lang.org/). Se você quiser brincar com a arquitetura e injetar seus próprios ADRs:

1. Assegure-se de ter o `nim` e o `nimble` (gerenciador de pacotes) instalados:
   ```bash
   curl https://nim-lang.org/choosenim/init.sh -sSf | sh
   ```
2. Clone o repositório:
   ```bash
   git clone https://github.com/invector-tecnologia/tai.git
   cd tai
   ```
3. Compile a aplicação na flag mais agressiva de liberação (Release C Backend):
   ```bash
   nimble build -y -d:release
   ```
4. Execute via:
   ```bash
   ./cambalhota
   ```

---
*Cambalhota - Porque gerenciar schemas e segurar os dados no tranco nunca precisou ser doloroso.*
