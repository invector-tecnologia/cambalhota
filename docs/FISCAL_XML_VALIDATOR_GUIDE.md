# Validador de XML - conformidade SEFAZ

## Rotas relacionadas

- API: /api/fiscal/*

## Visão Geral

O `FiscalXMLValidator` é um mecanismo robusto para validar XMLs de NF-e/NFC-e **antes e depois da assinatura digital**, garantindo 100% de conformidade com os padrões SEFAZ antes da transmissão.

## 📍 Localização

- **Validador**: `app/services/fiscal_xml_validator.ts`
- **Exemplos**: `app/examples/fiscal_xml_validator_examples.ts`
- **Integrado em**: `app/services/fiscal_signer.ts`

## 🎯 O que é Validado

### Validação Pré-Assinatura

```typescript
const validator = new FiscalXMLValidator()
const result = validator.validateUnsignedXML(xmlContent)
```

**Verifica:**

- ✅ XML bem-formado (sintaxe válida)
- ✅ Elemento raiz `<NFe>` presente
- ✅ Elemento `<infNFe>` obrigatório
- ✅ Campos obrigatórios: `<ide>`, `<emit>`, `<dest>`, `<det>`, `<total>`
- ✅ Subgrupos e metadados (CNPJ, IE, endereço)
- ✅ Itens da nota (pelo menos 1)
- ✅ Valores numéricos válidos
- ✅ Códigos fiscais (CFOP, NCM)
- ✅ Totalizadores (impostos, valores)

### Validação Pós-Assinatura

```typescript
const result = validator.validateSignedXML(signedXmlContent)
```

**Verifica tudo acima, mais:**

- ✅ Bloco `<Signature>` presente
- ✅ Estrutura XML Digital Signature correta:
  - `<SignedInfo>` com algoritmos
  - `<SignatureValue>` preenchido
  - `<DigestValue>` preenchido
  - `<KeyInfo>` com `<X509Certificate>`
- ✅ Certificado X509 anexado
- ✅ Uma única assinatura (não múltiplas)

## 📊 Estrutura de Resultado

```typescript
export interface XMLValidationResult {
  isValid: boolean                    // Passou em tudo?
  wellFormed: boolean                 // Sintaxe XML válida?
  isSigned: boolean                   // Tem assinatura?
  hasMandatoryFields: boolean         // Campos obrigatórios?
  signatureValid: boolean             // Assinatura válida?
  errors: ValidationError[]           // Lista de erros
  warnings: string[]                  // Avisos não-críticos
  details: {
    xmlVersion?: string               // Versão XML (ex: "1.0")
    encoding?: string                 // Encoding (ex: "UTF-8")
    rootElement?: string              // Elemento raiz (ex: "NFe")
    signatureElements?: number        // Quantidade de assinaturas
    nfeNumber?: string                // Número da NF-e
    accessKey?: string                // Chave de acesso (se houver)
  }
}
```

## 🚀 Como Usar

### 1. Validação Automática (Recomendado)

O `FiscalSigner` agora valida **automaticamente** antes e depois da assinatura:

```typescript
import FiscalSigner from '#services/fiscal_signer'

const signedXml = await FiscalSigner.signXml(
  xmlContent,
  certificatePath,
  certificatePassword,
  true  // validateBeforeSigning (padrão)
)
// ✓ XML validado pré-assinatura
// ✓ Assinatura realizada
// ✓ XML validado pós-assinatura
// ✓ Pronto para envio
```

### 2. Validação Manual (Para Debugging)

```typescript
import FiscalXMLValidator from '#services/fiscal_xml_validator'

const validator = new FiscalXMLValidator()

// Validar XML gerado (antes de assinar)
const preValidation = validator.validateUnsignedXML(xmlContent)

if (!preValidation.isValid) {
  console.error('XML inválido:')
  preValidation.errors.forEach(err => {
    console.error(`[${err.code}] ${err.message}`)
  })
  return
}

// ... assinar XML ...

// Validar XML assinado (antes de transmitir)
const postValidation = validator.validateSignedXML(signedXml)

if (!postValidation.isValid) {
  console.error('XML assinado inválido')
  return
}

// Pronto para transmissão
```

### 3. Gerar Relatório Legível

```typescript
const validator = new FiscalXMLValidator()
const result = validator.validateUnsignedXML(xmlContent)

// Gera relatório com emoji e formatação
const report = FiscalXMLValidator.generateReport(result)
console.log(report)
```

**Exemplo de output:**

```
📋 RELATÓRIO DE VALIDAÇÃO XML
==================================================

✅ RESULTADO GERAL: VÁLIDO ✓

📊 CHECKLIST:
  ✓ XML bem-formado
  ✓ Campos obrigatórios
  ✓ Assinado
  ✓ Assinatura válida

📄 METADADOS:
  • Versão XML: 1.0
  • Encoding: UTF-8
  • Elemento raiz: NFe
  • Número NF-e: 000000001
  • Assinaturas: 1

✅ XML APROVADO - Pronto para envio ao SEFAZ
```

## 🔴 Tipos de Erros

### Erros Críticos (severity: 'critical')

Impedem o prosseguimento:

- XML não bem-formado
- Campos obrigatórios ausentes
- Assinatura ausente/inválida
- Estrutura XML incorreta

### Erros Normais (severity: 'error')

Causarão rejeição do SEFAZ:

- Valores numéricos inválidos
- CFOP fora do padrão
- CEP com formato incorreto

### Avisos (warnings)

Podem causar problemas:

- Mais de 999 itens na nota
- Múltiplas assinaturas
- Valores muito grandes

## 📋 Checklist de Validação Automática

Cada validação verifica:

**Identificação (IDE)**

- [ ] Código UF
- [ ] CNF (código numérico)
- [ ] Assinatura QR Code
- [ ] Data/hora emissão

**Emitente (EMIT)**

- [ ] CNPJ ou CPF
- [ ] Razão social
- [ ] Inscrição Estadual
- [ ] Endereço completo
- [ ] CEP válido

**Destinatário (DEST)**

- [ ] CNPJ ou CPF
- [ ] Presença de CPF/CNPJ

**Itens (DET)**

- [ ] Pelo menos 1 item
- [ ] Código do produto
- [ ] Descrição
- [ ] CFOP válido
- [ ] Quantidade válida
- [ ] Valor unitário válido
- [ ] Máximo 999 itens

**Totalizadores (TOTAL)**

- [ ] Campos numéricos válidos
- [ ] Sem valores negativos
- [ ] vNF preenchido
- [ ] vProd preenchido

**Assinatura (SIGNATURE)**

- [ ] Presente
- [ ] SignedInfo
- [ ] SignatureValue preenchido
- [ ] DigestValue preenchido
- [ ] KeyInfo com X509Certificate
- [ ] Uma única assinatura

## 🎯 Fluxo Completo de Uso

```
┌─────────────────────────────────────────┐
│ 1. Gerar XML (FiscalTransformer)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 2. Validar Pré-Assinatura               │
│    (FiscalXMLValidator)                 │
│    ✓ Bem-formação                       │
│    ✓ Campos obrigatórios                │
│    ✓ Valores válidos                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 3. Assinar XML (FiscalSigner)           │
│    + Validação integrada                │
│    ✓ Certificado A1                     │
│    ✓ SHA-256-RSA                        │
│    ✓ Bloco <Signature> anexado          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 4. Validar Pós-Assinatura               │
│    (FiscalXMLValidator)                 │
│    ✓ Tudo anterior                      │
│    ✓ Assinatura presente                │
│    ✓ Certificado anexado                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 5. Transmitir ao SEFAZ (FiscalTransmitter)  │
│    ✓ XML garantidamente válido          │
│    ✓ Reduz chance de rejeição           │
└─────────────────────────────────────────┘
```

## 🧪 Testes Práticos

### Teste 1: Validar XML Gerado

```bash
# Adicionar ao seu teste
const xmlContent = await FiscalTransformer.transformToXml(...)
const validator = new FiscalXMLValidator()
const result = validator.validateUnsignedXML(xmlContent)

assert.isTrue(result.wellFormed, 'XML deve ser bem-formado')
assert.isTrue(result.hasMandatoryFields, 'Campos obrigatórios')
assert.isEmpty(result.errors.filter(e => e.severity === 'critical'))
```

### Teste 2: Validar XML Assinado

```bash
const signedXml = await FiscalSigner.signXml(...)
const result = validator.validateSignedXML(signedXml)

assert.isTrue(result.isSigned, 'XML deve estar assinado')
assert.isTrue(result.signatureValid, 'Assinatura válida')
assert.isTrue(result.isValid, 'XML completamente válido')
```

## ⚠️ Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `MALFORMED_XML` | Sintaxe XML inválida | Verificar tags fechadas |
| `MISSING_NFE_ROOT` | Elemento raiz ausente | XML deve começar com `<NFe>` |
| `MISSING_SIGNATURE` | Sem assinatura | Executar `FiscalSigner.signXml()` |
| `EMPTY_SIGNATURE_VALUE` | Assinatura vazia | Verificar certificado e PFX |
| `INVALID_CFOP` | CFOP fora do padrão | Usar CFOP válido (4 dígitos) |
| `NEGATIVE_VALUE_*` | Valores negativos | Verificar cálculos de totalizadores |

## 🔐 Segurança

- ✅ Validação **antes** de qualquer operação critica
- ✅ Não expõe dados sensíveis em logs
- ✅ Validação de certificado X509
- ✅ Verificação de bem-formação XML
- ✅ Previne envios inválidos ao SEFAZ

## 📚 Referências

- [Padrão XML Signature (W3C)](https://www.w3.org/TR/xmldsig-core/)
- [Manual de Orientação do Contribuinte (MOC 7.0)](https://www1.nfe.fazenda.gov.br/)
- [Validador Online SEFAZ](https://www.validador.nfe.fazenda.gov.br/)
