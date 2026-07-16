# Correção SOAP NF-e 4.00 — Causa Raiz do HTTP 400

## Problema

Todas as tentativas de autorização NFC-e retornavam **HTTP 400 Bad Request** do endpoint SEFAZ SVRS em homologação:

```
https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx
```

O transmissor tentava 4 variantes de SOAP e **todas falhavam com 400**.

## Causa Raiz

Duas falhas combinadas faziam com que **nenhuma** tentativa usasse o formato correto:

### 1. `nfeCabecMsg` no SOAP Header (NF-e 3.10 legado)

O `SefazSoapBuilder` incluía o elemento `<nfeCabecMsg>` dentro de `<soap:Header>`. Este elemento era **obrigatório na NF-e 3.10** mas foi **removido na NF-e 4.00** pela NT 2016.002.

A SEFAZ SVRS rejeita envelopes com `nfeCabecMsg` retornando HTTP 400.

### 2. Fallbacks usavam SOAP 1.1 em vez de SOAP 1.2

Os retries depois do 400 inicial tentavam SOAP 1.1 (`http://schemas.xmlsoap.org/soap/envelope/`) com `Content-Type: text/xml; charset=utf-8`. Os web services da NF-e 4.00 exigem exclusivamente **SOAP 1.2** (`http://www.w3.org/2003/05/soap-envelope`).

### 3. Parâmetro `action` ausente no Content-Type (SOAP 1.2 + .asmx)

Endpoints `.asmx` (ASP.NET/WCF) com SOAP 1.2 exigem que a **SOAP Action** seja informada no parâmetro `action` do header `Content-Type`. Sem ele, o servidor não sabe qual operação invocar e retorna HTTP 400.

Formato correto:

```
Content-Type: application/soap+xml;charset=utf-8;action="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote"
```

### Resultado

| Tentativa | SOAP | nfeCabecMsg | action no Content-Type | Resultado |
|-----------|------|-------------|------------------------|-----------|  
| 1ª | 1.2 | ✅ Presente | ❌ Ausente | 400 |
| 2ª | 1.1 | ✅ Presente | N/A | 400 |
| 3ª | 1.1 | ✅ Presente (unquoted action) | N/A | 400 |
| 4ª | 1.1 | ❌ Ausente | N/A | 400 (SOAP 1.1 inválido) |

**Nenhuma combinação = SOAP 1.2 + sem nfeCabecMsg + action no Content-Type**, que é o formato correto.

## Correção Aplicada

### Arquivos Reescritos

1. **`app/services/sefaz/sefaz_soap_builder.ts`** — Reescrito do zero

   - Removido `nfeCabecMsg` (legado NF-e 3.10)
   - Removidos métodos SOAP 1.1: `buildAutorizacaoSoap11()`, `buildAutorizacaoSoap11NoHeader()`, `buildConsultaProtocoloSoap11()`
   - Removido `getSoapAction()` e `buildCabecMsg()`
   - Agora usa prefixo `soap12:` com namespace correto
   - Adicionado `buildStatusServico()` para diagnóstico de disponibilidade

2. **`app/services/sefaz/types.ts`** — Atualizado

   - Removido tipo `SefazSoapActionType` (não mais necessário)
   - Adicionado campo `rawResponse?: string` em `SefazResponse` para diagnóstico

3. **`app/services/sefaz/sefaz_response_parser.ts`** — Reescrito do zero

   - Usa `matchAll` para encontrar TODOS os `<cStat>` e `<xMotivo>`
   - Prefere o último match (do `<protNFe>`) sobre o primeiro (do `<retEnviNFe>`)
   - Reconhece status 100 E 150 como sucesso
   - Detecta SOAP Fault
   - Inclui `rawResponse` para diagnóstico

4. **`app/services/fiscal_transmitter.ts`** — Reescrito do zero

   - Chamada única SOAP 1.2 (sem cascata de retries)
   - `Content-Type: application/soap+xml; charset=utf-8`
   - Erro de transporte separado de erro semântico da SEFAZ
   - Se SEFAZ retorna HTTP 500 mas com `<cStat>` no body, parseia normalmente
   - `rejectUnauthorized: true` (certificados ICP-Brasil são válidos)
   - Logging estruturado sem poluição

5. **`tests/unit/services/sefaz_soap_builder.spec.ts`** — Atualizado

   - Verifica ausência de `nfeCabecMsg`
   - Verifica prefixo `soap12:` e namespace correto
   - Teste para `buildStatusServico()`

### Formato Correto do Envelope (NF-e 4.00)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versão="4.00">
        <idLote>000000000000001</idLote>
        <indSinc>1</indSinc>
        <!-- NFC-e assinada aqui -->
      </enviNFe>
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>
```

**Pontos-chave:**

- `<soap12:Header>` ausente — sem `nfeCabecMsg`
- Namespace: `http://www.w3.org/2003/05/soap-envelope`
- Content-Type HTTP: `application/soap+xml;charset=utf-8;action="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote"`
- Sem header `SOAPAction` separado (SOAP 1.2 usa `action` no Content-Type)

## Referência

- **NT 2016.002**: Nota Técnica que introduziu NF-e 4.00 e removeu `nfeCabecMsg`
- **MOC 7.0**: Manual de Orientação do Contribuinte, versão 7.0
- **Web Services NF-e 4.00**: SOAP 1.2 obrigatório

---

## Correção 2: XML Malformado — `&` não-escapado no QR Code (2026-02-26)

### Problema persistente

Após as correções SOAP (nfeCabecMsg, action, SOAP 1.2), o HTTP 400 persistia.
Análise do payload SOAP logado revelou XML **malformado**:

```xml
<qrCode>https://...?p=...%7C000001&c=603B3B...</qrCode>
```

O `&` entre os parâmetros da URL do QR code é uma **referência de entidade XML inválida**.
O parser XML do endpoint `.asmx` (IIS/.NET) rejeita o documento inteiro com HTTP 400 "Bad Request"
antes que o SOAP handler seja invocado.

### Causa Raiz

1. `QRCodeNFCeGenerator.generate()` usa `URLSearchParams.toString()` que produz `p=...&c=...`
   (com `&` literal como separador)
2. `FiscalEmissionWorkflow.addNfceSupplementalInfo()` insere o URL no XML via template string:
   `` `<qrCode>${qrCodeUrl}</qrCode>` `` — **sem XML-escape**
3. Em XML, `&c` inicia uma referência de entidade que nunca termina (falta `;`),
   tornando o documento inteiro **ilegível** para qualquer parser XML

### Problemas adicionais encontrados

- **`<xCpl/>`** (complemento de endereço vazio): presente no XML mas o schema NF-e

  define `minLength="1"` — deveria ser omitido quando vazio

- **`<dhEmi>` com timezone `+00:00`**: Heroku roda em UTC, mas NFC-e exige o fuso

  horário da UF emitente (e.g., `-03:00` para RJ)

### Correções aplicadas

| Arquivo | Correção |
|---------|----------|
| `app/services/fiscal_emission_workflow.ts` | `<qrCode>` e `<urlChave>` agora usam `<![CDATA[...]]>` |
| `app/services/fiscal_transformer.ts` | `xCpl` omitido quando vazio (conditional spread) |
| `app/helpers/fiscal_formatters.ts` | `formatDateTimeForSEFAZ(date, uf?)` agora aceita UF e usa mapa de fusos BR |
| `app/services/fiscal_transformer.ts` | Passa `empresa.state` para `formatDateTimeForSEFAZ` |
| `app/services/sefaz/sefaz_soap_builder.ts` | Passa `this.state` para `formatDateTimeForSEFAZ` |
| `app/services/fiscal_service.ts` | Passa `uf` para `formatDateTimeForSEFAZ` em contingência |

### Fusos horários do Brasil (mapa UF → UTC)

| Fuso | Offset | UFs |
|------|--------|-----|
| BRT (Brasília) | -03:00 | AL, AP, BA, CE, DF, ES, GO, MA, MG, PA, PB, PE, PI, PR, RJ, RN, RS, SC, SE, SP, TO |
| AMT (Amazonas) | -04:00 | AM, MS, MT, RO, RR |
| ACT (Acre) | -05:00 | AC |

---

## Correção 3: QR Code V2 ONLINE — Schema XSD (cStat=225) (2026-02-26)

### Problema

Após eliminar o HTTP 400, a SEFAZ retornava:

```
cStat=225: Rejeicao: Falha no Schema XML da NFe (Elemento: enviNFe/NFe[1]/infNFeSupl/qrCode/)
```

### Causa Raiz (2 problemas combinados)

#### 3a. CDATA rejeitado pelo XSD

A primeira tentativa de XML-escape envolveu `<![CDATA[...]]>` no conteúdo de `<qrCode>`.
O XSD define `qrCode` como `xs:string` com **pattern restriction** — CDATA não é aceito
como conteúdo válido para validação de pattern.

**Correção:** Substituído CDATA por escape `&amp;` simples em `fiscal_emission_workflow.ts`.

#### 3b. Formato QR Code V2 ONLINE incorreto

O XSD `leiauteNFe_v4.00.xsd` define um pattern regex estrito para `qrCode`:

```regex
((HTTPS?|https?)://.*\?p=([0-9]{34}(1|3|4)[0-9]{9})\|[2]\|[1-2]\|(0|[1-9]{1}([0-9]{1,5})?)\|[A-Fa-f0-9]{40})
```

**Formato correto V2 ONLINE:**

```
https://URL?p=CHAVE44|2|TPAMB|CSCID|HASH40
```

O código anterior tinha 2 problemas:

1. `URLSearchParams.toString()` codifica `|` como `%7C` — o XSD exige pipe **literal**
2. O hash era passado como parâmetro separado `&c=HASH` — o XSD exige **tudo no campo `p`**

**Hash input (V2 ONLINE):**

```
SHA-1( chaveAcesso|versão|tpAmb|cscId + cscToken )
```

O `cscToken` é concatenado diretamente ao final (sem pipe separador).

### Correções aplicadas

| Arquivo | Correção |
|---------|----------|
| `app/services/qrcode_nfce_generator.ts` | **Reescrito `generate()`**: monta URL com pipes literais, hash no campo `p`, sem `URLSearchParams` |
| `app/services/qrcode_nfce_generator.ts` | Removidos `formatDateForHash()` e `formatValueForHash()` (V2 ONLINE não usa data/valor na URL) |
| `app/services/fiscal_emission_workflow.ts` | `&amp;` escape mantido como safety net (URLs V2 não contêm `&`) |
| `tests/unit/services/qrcode_nfce_generator.spec.ts` | Testes reescritos para validar pipes literais, ausência de `%7C`/`&c=`, hash no campo `p` |

### Formato final da URL gerada

```
https://www.sefaz.rs.gov.br/nfce/consulta?p=33260231968879000193650010000000291855639130|2|2|1|A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2
```

Campos separados por `|` literal:

1. Chave de acesso (44 dígitos)
2. Versão do QR Code (sempre `2`)
3. Tipo ambiente (`1`=produção, `2`=homologação)
4. ID do CSC
5. Hash SHA-1 (40 hex uppercase)
