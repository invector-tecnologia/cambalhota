# Configuracao do FISCAL_ENCRYPTION_KEY

## Rotas relacionadas

- UI: /config/fiscal
- API: /api/fiscal/*

## O que é?

`FISCAL_ENCRYPTION_KEY` é a chave de criptografia usada para proteger dados sensíveis do módulo fiscal, como **senhas de certificados A1**.

## ⚠️ Por que é importante?

- As senhas dos certificados PFX são criptografadas com **AES-256-CBC** e armazenadas no banco de dados
- Sem essa chave, não é possível descriptografar as senhas quando necessário
- Uma chave fraca compromete toda a segurança do módulo
- A criptografia e descriptografia acontecem automaticamente ao salvar/usar a configuracao fiscal

## 🚀 Como Configurar

### Opção 1: Para Desenvolvimento (Local)

#### 1.1 Editar arquivo `.env`

```bash
# Abrir o arquivo .env na raiz do projeto
code .env

# Ou com seu editor favorito
nano .env
vim .env
```

#### 1.2 Adicionar ou atualizar a chave

```env
# Módulo Fiscal
FISCAL_ENCRYPTION_KEY=change-me-with-a-secure-32-char-key
FISCAL_SEFAZ_HOMOLOG=true
FISCAL_SEFAZ_STATE=SP
```

**Salvar e fechar o arquivo.**

### Opção 2: Para Produção (Seguro) ⚡

#### 2.1 Gerar uma chave segura

**No Terminal/Command Prompt:**

```bash
# Usando OpenSSL
openssl rand -base64 32

# Ou usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Exemplo de saída:**

```
a3bF7kK9mN2pQwRsT5uVxYzA8bCdEfGhIjKlMnOpQrStUvWxYzA=
```

#### 2.2 Copiar a chave gerada

**No arquivo `.env`:**

```env
FISCAL_ENCRYPTION_KEY=a3bF7kK9mN2pQwRsT5uVxYzA8bCdEfGhIjKlMnOpQrStUvWxYzA=
```

#### 2.3 Para Heroku/Produção

```bash
# Via CLI do Heroku
heroku config:set FISCAL_ENCRYPTION_KEY="a3bF7kK9mN2pQwRsT5uVxYzA8bCdEfGhIjKlMnOpQrStUvWxYzA="

# Ou via Dashboard
# Settings → Config Vars → Add FISCAL_ENCRYPTION_KEY
```

---

## 📋 Exemplo Completo de `.env`

```env
# ============================================================
# Configuração da Aplicação
# ============================================================
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=aQAgiMOTr0oScvsbs8Owr5_8dbfqQ4Qw
NODE_ENV=development

# ============================================================
# Banco de Dados
# ============================================================
DB_CONNECTION=sqlite
DB_DATABASE=./tmp/db.sqlite

# ============================================================
# Sessão & Segurança
# ============================================================
SESSION_DRIVER=cookie

# ============================================================
# Email (opcional)
# ============================================================
SMTP_HOST=
SMTP_PORT=

# ============================================================
# 🔐 MÓDULO FISCAL - CONFIGURAÇÕES OBRIGATÓRIAS
# ============================================================

# Chave de criptografia para senhas de certificados
# ⚠️ IMPORTANTE: Alterar em produção com valor seguro!
FISCAL_ENCRYPTION_KEY=seu-valor-seguro-aqui

# Ambiente SEFAZ (true=homologação, false=produção)
FISCAL_SEFAZ_HOMOLOG=true

# Timeout para webservices SEFAZ (ms)
FISCAL_SEFAZ_TIMEOUT_MS=30000

# Estado padrão para emissão (SP, MG, RJ, BA, RS, etc)
FISCAL_SEFAZ_STATE=SP
```

---

## ✅ Verificação

### 1. Confirmar que a chave está carregada

Após adicionar ao `.env`, reinicie o servidor:

```bash
# Ctrl+C para parar
# Depois:
npm run dev
```

### 2. Testar a criptografia (Node.js)

```javascript
const FiscalProvider = require('#providers/fiscal_provider').default

// Criptografar
const encrypted = FiscalProvider.encryptSensitiveData('minha-senha-123')
console.log('Criptografado:', encrypted)

// Descriptografar
const decrypted = FiscalProvider.decryptSensitiveData(encrypted)
console.log('Descriptografado:', decrypted)
```

### 3. Verificar no banco de dados

Após registrar uma configuração fiscal:

```bash
# Conectar ao banco
sqlite3 ./tmp/db.sqlite

# Ver tabela (a senha estará criptografada)
SELECT id, establishment_id, certificate_password FROM fiscal_configs;

# Sair
.quit
```

---

## 🔒 Boas Práticas de Segurança

### ✅ FAÇA

- ✅ Use uma chave com **32+ caracteres aleatórios**
- ✅ Guarde a chave em **local seguro** (gerenciador de senhas)
- ✅ Use **valores diferentes** em dev, stage e produção
- ✅ **Nunca commite** `.env` no Git (use `.gitignore`)
- ✅ **Rode migrations** após configurar: `node ace migration:run`

### ❌ NÃO FAÇA

- ❌ Não use a chave padrão em produção
- ❌ Não use senhas simples como "123456"
- ❌ Não compartilhe a chave por email/Slack
- ❌ Não deixe a chave em código-fonte
- ❌ Não faça commit de `.env` no repositório

---

## 🚨 Se Perder a Chave

**Problema**: Você não consegue mais descriptografar as senhas dos certificados

**Solução**:

1. Gerar nova chave
2. Atualizar `.env`
3. **Deletar registros antigos** de `fiscal_configs` (as senhas criptografadas ficam inúteis)
4. Recadastrar com nova chave:

   ```bash
   DELETE FROM fiscal_configs;
   ```

5. Registrar novamente via API: `POST /api/fiscal/config`

---

## 📞 Checklist de Implementação

- [ ] Abrir arquivo `.env`
- [ ] Encontrar ou criar a linha `FISCAL_ENCRYPTION_KEY`
- [ ] Gerar uma chave segura (32+ caracteres)
- [ ] Colar a chave no arquivo
- [ ] Salvar e fechar
- [ ] Reiniciar o servidor (`npm run dev`)
- [ ] Rodar migrations: `node ace migration:run`
- [ ] Testar: `POST /api/fiscal/config`

---

## 🎓 Alternativas Avançadas

### Usando Docker Secrets (Produção)

```dockerfile
# Dockerfile
ENV FISCAL_ENCRYPTION_KEY=/run/secrets/fiscal_key
```

### Usando AWS Secrets Manager

```typescript
// Em providers/fiscal_provider.ts
const secretsManager = new AWS.SecretsManager()
const secret = await secretsManager.getSecretValue({
  SecretId: 'fiscal-encryption-key'
}).promise()
```

### Usando Azure Key Vault

```typescript
const { SecretClient } = require("@azure/keyvault-secrets")
const client = new SecretClient(vaultUrl, new DefaultAzureCredential())
const secret = await client.getSecret("fiscal-encryption-key")
```

---

## 📚 Referências

- [AdonisJS Config](https://docs.adonisjs.com/guides/environment-variables)
- [Crypto Node.js](https://nodejs.org/api/crypto.html)
- [OpenSSL Random](https://www.openssl.org/docs/manmaster/man1/openssl-rand.html)

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024  
**Status**: Configuração Essencial ✅
