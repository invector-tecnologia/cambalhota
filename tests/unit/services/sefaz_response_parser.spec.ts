import { test } from '@japa/runner'
import SefazResponseParser from '#services/sefaz/sefaz_response_parser'

test.group('SefazResponseParser', () => {
  test('parse extrai campos principais', ({ assert }) => {
    const response = `
      <retEnviNFe>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NF-e</xMotivo>
        <chNFe>33260231968879000193650010000000021801405952</chNFe>
        <nProt>123456789012345</nProt>
      </retEnviNFe>
    `

    const parsed = SefazResponseParser.parse(response)

    assert.equal(parsed.status, 100)
    assert.equal(parsed.message, 'Autorizado o uso da NF-e')
    assert.equal(parsed.accessKey, '33260231968879000193650010000000021801405952')
    assert.equal(parsed.protocolNumber, '123456789012345')
  })

  test('parse retorna undefined quando campos ausentes', ({ assert }) => {
    const response = '<retEnviNFe><cStat>0</cStat></retEnviNFe>'

    const parsed = SefazResponseParser.parse(response)

    assert.equal(parsed.status, 0)
    assert.isUndefined(parsed.message)
    assert.isUndefined(parsed.accessKey)
    assert.isUndefined(parsed.protocolNumber)
  })
})
