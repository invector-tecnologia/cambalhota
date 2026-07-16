import { test } from '@japa/runner'
import SefazSoapBuilder from '#services/sefaz/sefaz_soap_builder'

test.group('SefazSoapBuilder', () => {
  test('buildAutorizacao usa SOAP 1.2 sem nfeCabecMsg', ({ assert }) => {
    const builder = new SefazSoapBuilder('RJ', 2)
    const xmlContent = '<NFe><infNFe Id="NFe123" /></NFe>'

    const soap = builder.buildAutorizacao(xmlContent)

    // SOAP 1.2 com prefixo soap12:
    assert.include(soap, '<soap12:Envelope')
    assert.include(soap, 'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"')
    // nfeCabecMsg NÃO deve estar presente (removido na NF-e 4.00)
    assert.notInclude(soap, 'nfeCabecMsg')
    assert.notInclude(soap, '<cUF>')
    // Conteúdo esperado
    assert.include(soap, '<enviNFe')
    assert.include(soap, xmlContent)
    assert.match(soap, /<idLote>\d{15}<\/idLote>/)
  })

  test('buildConsultaProtocolo inclui chave e tpAmb', ({ assert }) => {
    const builder = new SefazSoapBuilder('RJ', 2)
    const accessKey = '33260231968879000193650010000000021801405952'

    const soap = builder.buildConsultaProtocolo(accessKey)

    assert.include(soap, `<chNFe>${accessKey}</chNFe>`)
    assert.include(soap, `<tpAmb>2</tpAmb>`)
    assert.include(soap, '<soap12:Envelope')
    assert.notInclude(soap, 'nfeCabecMsg')
  })

  test('buildCancelamento inclui chave e justificativa', ({ assert }) => {
    const builder = new SefazSoapBuilder('RJ', 2)
    const accessKey = '33260231968879000193650010000000021801405952'
    const protocol = '123456789012345'
    const justification = 'Cancelamento teste'
    const cnpj = '31968879000193'

    const soap = builder.buildCancelamento(accessKey, protocol, justification, cnpj)

    assert.include(soap, `<chNFe>${accessKey}</chNFe>`)
    assert.include(soap, `<xJust>${justification}</xJust>`)
    assert.include(soap, '<soap12:Envelope')
    assert.notInclude(soap, 'nfeCabecMsg')
  })

  test('buildStatusServico retorna envelope SOAP 1.2 correto', ({ assert }) => {
    const builder = new SefazSoapBuilder('RJ', 2)

    const soap = builder.buildStatusServico()

    assert.include(soap, '<soap12:Envelope')
    assert.include(soap, '<consStatServ')
    assert.include(soap, '<tpAmb>2</tpAmb>')
    assert.include(soap, '<cUF>33</cUF>')
    assert.include(soap, '<xServ>STATUS</xServ>')
    assert.notInclude(soap, 'nfeCabecMsg')
  })
})
