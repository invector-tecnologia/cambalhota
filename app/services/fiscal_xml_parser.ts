import { XMLParser } from 'fast-xml-parser'

interface ParsedQrPayload {
  accessKey?: string
  tpAmb?: number
  dhEmi?: string
  vNF?: number
  digVal?: string
}

interface ParsedNfeData {
  dest: any
  emit: any
  items: any[]
  total: any
  totalsRaw: any
  qrPayload: ParsedQrPayload
}

export default class FiscalXmlParser {
  private static buildParser(): XMLParser {
    return new XMLParser({ ignoreAttributes: false })
  }

  static parseForPrint(xmlContent: string): ParsedNfeData {
    const parser = this.buildParser()
    const parsed: any = parser.parse(xmlContent)
    const nfe = parsed?.NFe || parsed?.nfeProc?.NFe || {}
    const inf = nfe?.infNFe || {}

    const dest = inf?.dest || {}
    const emit = inf?.emit || {}
    const det = inf?.det
    const total = inf?.total?.ICMSTot || {}
    const totalsRaw = inf?.total || {}

    const itemsArray = Array.isArray(det) ? det : det ? [det] : []
    const items = itemsArray.map((d: any) => {
      const prod = d?.prod || {}
      const imposto = d?.imposto || {}
      const icms = imposto?.ICMS || {}
      const icmsNodeName = Object.keys(icms)[0]
      const icmsNode = icmsNodeName ? icms[icmsNodeName] : {}
      const pis = imposto?.PIS || {}
      const pisNodeName = Object.keys(pis)[0]
      const pisNode = pisNodeName ? pis[pisNodeName] : {}
      const cofins = imposto?.COFINS || {}
      const cofinsNodeName = Object.keys(cofins)[0]
      const cofinsNode = cofinsNodeName ? cofins[cofinsNodeName] : {}
      const ipi = imposto?.IPI || {}
      const ipiNodeName = Object.keys(ipi)[0]
      const ipiNode = ipiNodeName ? ipi[ipiNodeName] : {}

      return {
        name: prod.xProd,
        quantity: prod.qCom,
        unitPrice: prod.vUnCom,
        subtotal: prod.vItem || prod.vProd || prod.vUnCom,
        ncm: prod.NCM,
        cfop: prod.CFOP,
        uCom: prod.uCom,
        taxes: {
          icms: { cst: icmsNode?.CST, vICMS: icmsNode?.vICMS, pICMS: icmsNode?.pICMS },
          pis: { vPIS: pisNode?.vPIS, pPIS: pisNode?.pPIS },
          cofins: { vCOFINS: cofinsNode?.vCOFINS, pCOFINS: cofinsNode?.pCOFINS },
          ipi: { vIPI: ipiNode?.vIPI, pIPI: ipiNode?.pIPI },
        },
      }
    })

    const accessKeyRaw = inf?.['@_Id'] || inf?.Id
    const accessKey =
      typeof accessKeyRaw === 'string' ? accessKeyRaw.replace(/^NFe/, '') : undefined
    const tpAmb = inf?.ide?.tpAmb ? Number(inf.ide.tpAmb) : undefined
    const dhEmi = inf?.ide?.dhEmi
    const vNF = total?.vNF !== undefined ? Number(total.vNF) : undefined
    const digVal =
      nfe?.Signature?.SignedInfo?.Reference?.DigestValue ||
      nfe?.Signature?.DigestValue ||
      nfe?.Signature?.SignedInfo?.Reference?.['DigestValue'] ||
      undefined

    return {
      dest,
      emit,
      items,
      total,
      totalsRaw,
      qrPayload: {
        accessKey,
        tpAmb,
        dhEmi,
        vNF,
        digVal,
      },
    }
  }
}
