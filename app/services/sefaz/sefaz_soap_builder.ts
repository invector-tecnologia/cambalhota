import { cleanCNPJ, formatDateTimeForSEFAZ, getUFCode } from '#helpers/fiscal_formatters'

/**
 * Construtor de envelopes SOAP para Web Services da SEFAZ
 *
 * NF-e 4.00 (NT 2016.002):
 *  - SOAP 1.2 obrigatório (namespace http://www.w3.org/2003/05/soap-envelope)
 *  - nfeCabecMsg foi REMOVIDO do SOAP Header na versão 4.00
 *  - Content-Type: application/soap+xml; charset=utf-8
 */
export default class SefazSoapBuilder {
  constructor(
    private readonly state: string,
    private readonly tpAmb: number
  ) {}

  /**
   * Envelope SOAP 1.2 para autorização de NFC-e (NF-e 4.00)
   * Sem nfeCabecMsg — removido na versão 4.00 (NT 2016.002)
   */
  buildAutorizacao(xmlContent: string): string {
    const xmlClean = xmlContent.replace(/<\?xml[^>]*\?>/i, '').trim()
    const idLote = this.generateIdLote()

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
      ` xmlns:xsd="http://www.w3.org/2001/XMLSchema"` +
      ` xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap12:Body>` +
      `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">` +
      `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
      `<idLote>${idLote}</idLote>` +
      `<indSinc>1</indSinc>` +
      `${xmlClean}` +
      `</enviNFe>` +
      `</nfeDadosMsg>` +
      `</soap12:Body>` +
      `</soap12:Envelope>`
    )
  }

  /**
   * Envelope SOAP 1.2 para consulta de protocolo (NF-e 4.00)
   */
  buildConsultaProtocolo(accessKey: string): string {
    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
      ` xmlns:xsd="http://www.w3.org/2001/XMLSchema"` +
      ` xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap12:Body>` +
      `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">` +
      `<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
      `<tpAmb>${this.tpAmb}</tpAmb>` +
      `<xServ>CONSULTAR</xServ>` +
      `<chNFe>${accessKey}</chNFe>` +
      `</consSitNFe>` +
      `</nfeDadosMsg>` +
      `</soap12:Body>` +
      `</soap12:Envelope>`
    )
  }

  /**
   * Envelope SOAP 1.2 para cancelamento via recepção de evento (NF-e 4.00)
   */
  buildCancelamento(
    accessKey: string,
    protocolNumber: string,
    justification: string,
    cnpj: string
  ): string {
    const idLote = this.generateIdLote()
    const cOrgao = this.getCUF()
    const idEvento = `ID110111${accessKey}01`
    const dhEvento = formatDateTimeForSEFAZ(new Date(), this.state)
    const cnpjClean = cleanCNPJ(cnpj)

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
      ` xmlns:xsd="http://www.w3.org/2001/XMLSchema"` +
      ` xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap12:Body>` +
      `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">` +
      `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">` +
      `<idLote>${idLote}</idLote>` +
      `<evento versao="1.00">` +
      `<infEvento Id="${idEvento}">` +
      `<cOrgao>${cOrgao}</cOrgao>` +
      `<tpAmb>${this.tpAmb}</tpAmb>` +
      `<CNPJ>${cnpjClean}</CNPJ>` +
      `<chNFe>${accessKey}</chNFe>` +
      `<dhEvento>${dhEvento}</dhEvento>` +
      `<tpEvento>110111</tpEvento>` +
      `<nSeqEvento>1</nSeqEvento>` +
      `<verEvento>1.00</verEvento>` +
      `<detEvento versao="1.00">` +
      `<descEvento>Cancelamento</descEvento>` +
      `<nProt>${protocolNumber}</nProt>` +
      `<xJust>${justification}</xJust>` +
      `</detEvento>` +
      `</infEvento>` +
      `</evento>` +
      `</envEvento>` +
      `</nfeDadosMsg>` +
      `</soap12:Body>` +
      `</soap12:Envelope>`
    )
  }

  /**
   * Envelope SOAP 1.2 para consulta de status do serviço
   */
  buildStatusServico(): string {
    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
      ` xmlns:xsd="http://www.w3.org/2001/XMLSchema"` +
      ` xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap12:Body>` +
      `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">` +
      `<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
      `<tpAmb>${this.tpAmb}</tpAmb>` +
      `<cUF>${this.getCUF()}</cUF>` +
      `<xServ>STATUS</xServ>` +
      `</consStatServ>` +
      `</nfeDadosMsg>` +
      `</soap12:Body>` +
      `</soap12:Envelope>`
    )
  }

  private generateIdLote(): string {
    const now = Date.now().toString()
    const base = now.length > 15 ? now.slice(-15) : now
    return base.padStart(15, '0')
  }

  private getCUF(): string {
    return String(getUFCode(this.state)).padStart(2, '0')
  }
}
