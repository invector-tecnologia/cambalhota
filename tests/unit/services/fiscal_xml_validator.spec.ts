import { test } from '@japa/runner'
import FiscalXMLValidator from '#services/fiscal_xml_validator'

test.group('FiscalXMLValidator - Pré-Assinatura', () => {
  test('deve validar XML bem-formado com campos obrigatórios', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001" versao="4.00">
    <ide>
      <cUF>31</cUF>
      <cNF>12345678</cNF>
      <assinaturaQrCode>123456</assinaturaQrCode>
      <mod>65</mod>
      <serie>1</serie>
      <nNF>1</nNF>
      <dhEmi>2024-01-01T10:00:00</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
    </ide>
    <emit>
      <CNPJ>12345678000195</CNPJ>
      <xNome>TAVOLO RESTAURANTE</xNome>
      <enderEmit>
        <xLgr>RUA TESTE</xLgr>
        <nro>100</nro>
        <xMun>BELO HORIZONTE</xMun>
        <CEP>30140071</CEP>
      </enderEmit>
      <IE>123456789012345</IE>
      <CRT>3</CRT>
    </emit>
    <dest>
      <CPF>12345678901</CPF>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>0000001</cProd>
        <xProd>PRATO PRINCIPAL</xProd>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>1</qCom>
        <vUnCom>150.00</vUnCom>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vBC>0</vBC>
        <vICMS>0</vICMS>
        <vBCST>0</vBCST>
        <vST>0</vST>
        <vProd>150.00</vProd>
        <vFrete>0</vFrete>
        <vSeg>0</vSeg>
        <vDesc>0</vDesc>
        <vII>0</vII>
        <vIPI>0</vIPI>
        <vPIS>0</vPIS>
        <vCOFINS>0</vCOFINS>
        <vOutro>0</vOutro>
        <vNF>150.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`

    const result = validator.validateUnsignedXML(validXML)

    assert.isTrue(result.isValid, 'XML deve ser válido')
    assert.isTrue(result.wellFormed, 'XML deve ser bem-formado')
    assert.isTrue(result.hasMandatoryFields, 'Deve ter campos obrigatórios')
    assert.equal(result.errors.length, 0, 'Não deve ter erros críticos')
  })

  test('deve rejeitar XML sem campos obrigatórios', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const missingFieldsXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001" versao="4.00">
    <ide>
      <!-- Campos obrigatórios faltando -->
    </ide>
    <emit></emit>
    <dest></dest>
    <det></det>
    <total></total>
  </infNFe>
</NFe>`

    const result = validator.validateUnsignedXML(missingFieldsXML)

    assert.isFalse(result.hasMandatoryFields, 'Deve falhar campos obrigatórios')
    assert.isNotEmpty(result.errors, 'Deve ter múltiplos erros')
  })

  test('deve rejeitar valores numéricos inválidos', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const invalidNumberXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001" versao="4.00">
    <ide>
      <cUF>31</cUF>
      <cNF>12345678</cNF>
      <assinaturaQrCode>123456</assinaturaQrCode>
      <dhEmi>2024-01-01T10:00:00</dhEmi>
    </ide>
    <emit>
      <CNPJ>12345678000195</CNPJ>
      <xNome>TAVOLO</xNome>
      <IE>123456789012345</IE>
    </emit>
    <dest>
      <CPF>12345678901</CPF>
    </dest>
    <det nItem="1">
      <prod>
        <code>0000001</code>
        <xProd>TESTE</xProd>
        <CFOP>5102</CFOP>
        <qCom>abc</qCom>
        <vUnCom>xyz</vUnCom>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vProd>-150.00</vProd>
        <vNF>150.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`

    const result = validator.validateUnsignedXML(invalidNumberXML)

    assert.isNotEmpty(result.errors, 'Deve ter erros de validação numérica')
  })

  test('deve validar CFOP válido', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const validCFOPXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001" versao="4.00">
    <ide>
      <cUF>31</cUF>
      <cNF>12345678</cNF>
      <assinaturaQrCode>123456</assinaturaQrCode>
      <dhEmi>2024-01-01T10:00:00</dhEmi>
    </ide>
    <emit>
      <CNPJ>12345678000195</CNPJ>
      <xNome>TAVOLO</xNome>
      <IE>123456789012345</IE>
    </emit>
    <dest>
      <CPF>12345678901</CPF>
    </dest>
    <det nItem="1">
      <prod>
        <code>0000001</code>
        <xProd>TESTE</xProd>
        <CFOP>5102</CFOP>
        <qCom>1</qCom>
        <vUnCom>100.00</vUnCom>
      </prod>
    </det>
    <total>
      <ICMSTot>
        <vProd>100.00</vProd>
        <vNF>100.00</vNF>
      </ICMSTot>
    </total>
  </infNFe>
</NFe>`

    const result = validator.validateUnsignedXML(validCFOPXML)

    const cfopErrors = result.errors.filter((e) => e.code.includes('CFOP'))
    assert.isEmpty(cfopErrors, 'CFOP válido não deve gerar erros')
  })

  test('deve gerar relatório formatado', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001">
    <ide><cUF>31</cUF><cNF>12345678</cNF><assinaturaQrCode>123</assinaturaQrCode><dhEmi>2024-01-01T10:00:00</dhEmi></ide>
    <emit><CNPJ>12345678000195</CNPJ><xNome>TAVOLO</xNome><IE>123456789012345</IE></emit>
    <dest><CPF>12345678901</CPF></dest>
    <det nItem="1"><prod><code>001</code><xProd>TESTE</xProd><CFOP>5102</CFOP><qCom>1</qCom><vUnCom>100.00</vUnCom></prod></det>
    <total><ICMSTot><vProd>100.00</vProd><vNF>100.00</vNF></ICMSTot></total>
  </infNFe>
</NFe>`

    const result = validator.validateUnsignedXML(validXML)
    const report = FiscalXMLValidator.generateReport(result)

    assert.include(report, 'RELATÓRIO DE VALIDAÇÃO XML', 'Relatório deve ter título')
    assert.include(report, 'RESULTADO GERAL', 'Relatório deve mencionar resultado geral')
    assert.include(report, 'VÁLIDO', 'Relatório deve mostrar que XML é válido')
  })
})

test.group('FiscalXMLValidator - Pós-Assinatura', () => {
  test('deve rejeitar XML assinado sem bloco Signature', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const unsignedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001">
    <ide><cUF>31</cUF></ide>
  </infNFe>
</NFe>`

    const result = validator.validateSignedXML(unsignedXML)

    assert.isFalse(result.isSigned, 'XML sem assinatura não deve passar')
    assert.isNotEmpty(
      result.errors.filter((e) => e.code === 'MISSING_SIGNATURE'),
      'Deve reportar assinatura ausente'
    )
  })

  test('deve validar estrutura de Signature completa', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const signedXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001">
    <ide><cUF>31</cUF></ide>
  </infNFe>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <Reference URI="">
        <DigestValue>abc123def456</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>xyz789uvw012</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>MIID...</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</NFe>`

    const result = validator.validateSignedXML(signedXML)

    assert.isTrue(result.isSigned, 'XML deve ter assinatura')
    assert.isAtLeast(result.details.signatureElements!, 1, 'Deve ter pelo menos 1 assinatura')
  })

  test('deve rejeitar SignatureValue vazio', ({ assert }) => {
    const validator = new FiscalXMLValidator()

    const emptySigXML = `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe Id="NFe000000001"/>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignatureValue></SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>MIID...</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</NFe>`

    const result = validator.validateSignedXML(emptySigXML)

    assert.isFalse(result.signatureValid, 'Assinatura vazia deve falhar')
    assert.isNotEmpty(
      result.errors.filter((e) => e.code === 'EMPTY_SIGNATURE_VALUE'),
      'Deve reportar assinatura vazia'
    )
  })
})
