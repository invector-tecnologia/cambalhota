import crypto from 'node:crypto'
import type Empresa from '#models/empresa'
import type FiscalConfig from '#models/fiscal_config'

/**
 * Gera QR Code para NFC-e conforme Manual de Padrões Técnicos SEFAZ
 *
 * Especificação: NT 2020.006 v1.50
 *
 * Padrão do QR Code NFC-e:
 * - URL da Consulta por UF
 * - Parâmetros: chNFe, tpAmb, dhEmi, vNF, digVal, cDest, cHashQRCode
 * - cHashQRCode = SHA-1 da concatenação dos valores + CSC
 */
export default class QRCodeNFCeGenerator {
  /**
   * URLs do QR Code NFC-e por UF (NfeConsultaQR)
   * Fonte: nfephp-org/sped-nfe wsnfe_4.00_mod65.xml
   *
   * IMPORTANTE: estas URLs são DIFERENTES das urlChave.
   * SEFAZ valida o QR Code URL (cStat=395) contra esta tabela.
   */
  private static readonly QRCODE_URLS: Record<string, { producao: string; homologacao: string }> = {
    AC: {
      producao: 'http://www.sefaznet.ac.gov.br/nfce/qrcode',
      homologacao: 'http://www.hml.sefaznet.ac.gov.br/nfce/qrcode',
    },
    AL: {
      producao: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',
      homologacao: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',
    },
    AM: {
      producao: 'https://sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',
      homologacao: 'https://sistemas.sefaz.am.gov.br/nfceweb-hom/consultarNFCe.jsp',
    },
    AP: {
      producao: 'https://www.sefaz.ap.gov.br/nfce/nfcep.php',
      homologacao: 'https://www.sefaz.ap.gov.br/nfcehml/nfce.php',
    },
    BA: {
      producao: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
      homologacao: 'http://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
    },
    CE: {
      producao: 'http://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html',
      homologacao: 'http://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html',
    },
    DF: {
      producao: 'http://www.fazenda.df.gov.br/nfce/qrcode',
      homologacao: 'http://dec.fazenda.df.gov.br/ConsultarNFCe.aspx',
    },
    ES: {
      producao: 'http://app.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx',
      homologacao: 'http://homologacao.sefaz.es.gov.br/ConsultaNFCe/qrcode.aspx',
    },
    GO: {
      producao: 'https://nfeweb.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',
      homologacao: 'https://nfewebhomolog.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',
    },
    MA: {
      producao: 'http://www.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
      homologacao: 'http://www.hom.nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
    },
    MG: {
      producao: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
      homologacao: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
    },
    MS: {
      producao: 'http://www.dfe.ms.gov.br/nfce/qrcode',
      homologacao: 'http://www.dfe.ms.gov.br/nfce/qrcode',
    },
    MT: {
      producao: 'http://www.sefaz.mt.gov.br/nfce/consultanfce',
      homologacao: 'http://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
    },
    PA: {
      producao: 'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/nfceForm.seam',
      homologacao:
        'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/nfceForm.seam',
    },
    PB: {
      producao: 'http://www.sefaz.pb.gov.br/nfce',
      homologacao: 'http://www.sefaz.pb.gov.br/nfcehom',
    },
    PE: {
      producao: 'http://nfce.sefaz.pe.gov.br/nfce/consulta',
      homologacao: 'http://nfcehomolog.sefaz.pe.gov.br/nfce/consulta',
    },
    PI: {
      producao: 'http://www.sefaz.pi.gov.br/nfce/qrcode',
      homologacao: 'http://www.sefaz.pi.gov.br/nfce/qrcode',
    },
    PR: {
      producao: 'http://www.fazenda.pr.gov.br/nfce/qrcode',
      homologacao: 'http://www.fazenda.pr.gov.br/nfce/qrcode',
    },
    RJ: {
      producao: 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode',
      homologacao: 'http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode',
    },
    RN: {
      producao: 'http://nfce.set.rn.gov.br/consultarNFCe.aspx',
      homologacao: 'http://hom.nfce.set.rn.gov.br/consultarNFCe.aspx',
    },
    RO: {
      producao: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
      homologacao: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
    },
    RR: {
      producao: 'https://www.sefaz.rr.gov.br/servlet/qrcode',
      homologacao: 'http://200.174.88.103:8080/nfce/servlet/qrcode',
    },
    RS: {
      producao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
      homologacao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
    },
    SC: {
      producao: 'https://sat.sef.sc.gov.br/nfce/consulta',
      homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
    },
    SE: {
      producao: 'http://www.nfce.se.gov.br/nfce/qrcode',
      homologacao: 'http://www.hom.nfe.se.gov.br/nfce/qrcode',
    },
    SP: {
      producao: 'https://www.nfce.fazenda.sp.gov.br/qrcode',
      homologacao: 'https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode',
    },
    TO: {
      producao: 'http://www.sefaz.to.gov.br/nfce/qrcode',
      homologacao: 'http://homologacao.sefaz.to.gov.br/nfce/qrcode',
    },
  }

  /**
   * URLs de consulta por chave (urlChave) por UF
   * Fonte: nfephp-org/sped-nfe uri_consulta_nfce.json
   *
   * Estas URLs vão no campo <urlChave> do infNFeSupl.
   */
  private static readonly CONSULTA_URLS: Record<string, { producao: string; homologacao: string }> =
    {
      // ── URLs oficiais de consulta NFC-e por UF ──────────────────────
      // Fonte: nfephp-org/sped-nfe uri_consulta_nfce.json (2024)
      // Cada UF tem URL própria, mesmo as autorizadas pela SVRS.
      // SEFAZ valida o domínio (cStat=395 se divergir).
      AC: {
        producao: 'https://www.sefaznet.ac.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaznet.ac.gov.br/nfce/consulta',
      },
      AL: {
        producao: 'https://www.sefaz.al.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.al.gov.br/nfce/consulta',
      },
      AM: {
        producao: 'https://www.sefaz.am.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.am.gov.br/nfce/consulta',
      },
      AP: {
        producao: 'https://www.sefaz.ap.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.ap.gov.br/nfce/consulta',
      },
      BA: {
        producao: 'http://www.sefaz.ba.gov.br/nfce/consulta',
        homologacao: 'http://hinternet.sefaz.ba.gov.br/nfce/consulta',
      },
      CE: {
        producao: 'https://www.sefaz.ce.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.ce.gov.br/nfce/consulta',
      },
      DF: {
        producao: 'https://www.fazenda.df.gov.br/nfce/consulta',
        homologacao: 'https://www.fazenda.df.gov.br/nfce/consulta',
      },
      ES: {
        producao: 'https://www.sefaz.es.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.es.gov.br/nfce/consulta',
      },
      GO: {
        producao: 'https://www.sefaz.go.gov.br/nfce/consulta',
        homologacao: 'https://www.nfce.go.gov.br/post/ver/214413/consulta-nfc-e-homologacao',
      },
      MA: {
        producao: 'https://www.sefaz.ma.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.ma.gov.br/nfce/consulta',
      },
      MG: {
        producao: 'https://portalsped.fazenda.mg.gov.br/portalnfce',
        homologacao: 'https://hportalsped.fazenda.mg.gov.br/portalnfce',
      },
      MS: {
        producao: 'http://www.dfe.ms.gov.br/nfce/consulta',
        homologacao: 'http://www.dfe.ms.gov.br/nfce/consulta',
      },
      MT: {
        producao: 'http://www.sefaz.mt.gov.br/nfce/consultanfce',
        homologacao: 'http://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
      },
      PA: {
        producao: 'https://www.sefa.pa.gov.br/nfce/consulta',
        homologacao: 'https://www.sefa.pa.gov.br/nfce/consulta',
      },
      PB: {
        producao: 'https://www.sefaz.pb.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.pb.gov.br/nfcehom',
      },
      PE: {
        producao: 'https://nfce.sefaz.pe.gov.br/nfce/consulta',
        homologacao: 'https://nfce.sefaz.pe.gov.br/nfce/consulta',
      },
      PI: {
        producao: 'https://www.sefaz.pi.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.pi.gov.br/nfce/consulta',
      },
      PR: {
        producao: 'http://www.fazenda.pr.gov.br/nfce/consulta',
        homologacao: 'http://www.fazenda.pr.gov.br/nfce/consulta',
      },
      RJ: {
        producao: 'https://www.fazenda.rj.gov.br/nfce/consulta',
        homologacao: 'https://www.fazenda.rj.gov.br/nfce/consulta',
      },
      RN: {
        producao: 'https://www.set.rn.gov.br/nfce/consulta',
        homologacao: 'https://www.set.rn.gov.br/nfce/consulta',
      },
      RO: {
        producao: 'https://www.sefin.ro.gov.br/nfce/consulta',
        homologacao: 'https://www.sefin.ro.gov.br/nfce/consulta',
      },
      RR: {
        producao: 'https://www.sefaz.rr.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.rr.gov.br/nfce/consulta',
      },
      RS: {
        producao: 'https://www.sefaz.rs.gov.br/nfce/consulta',
        homologacao: 'https://www.sefaz.rs.gov.br/nfce/consulta',
      },
      SC: {
        producao: 'https://sat.sef.sc.gov.br/nfce/consulta',
        homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
      },
      SE: {
        producao: 'http://www.nfce.se.gov.br/nfce/consulta',
        homologacao: 'http://www.hom.nfe.se.gov.br/nfce/consulta',
      },
      SP: {
        producao: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica',
        homologacao: 'https://www.homologacao.nfce.fazenda.sp.gov.br/NFCeConsultaPublica',
      },
      TO: {
        producao: 'https://www.sefaz.to.gov.br/nfce/consulta',
        homologacao: 'http://homologacao.sefaz.to.gov.br/nfce/consulta.jsf',
      },
    }

  /**
   * Gera URL do QR Code para NFC-e autorizada
   *
   * @param chaveAcesso - Chave de acesso da NFC-e (44 dígitos)
   * @param tpAmb - Tipo de ambiente (1=Produção, 2=Homologação)
   * @param dhEmi - Data/hora de emissão no formato AAAA-MM-DDTHH:mm:ssTZD
   * @param vNF - Valor total da NF-e (formato decimal com 2 casas)
   * @param digVal - Digest Value (hash da assinatura digital)
   * @param empresa - Dados da empresa emitente
   * @param fiscalConfig - Configurações fiscais (CSC)
   * @param cpfCnpjDest - CPF/CNPJ do destinatário (opcional)
   * @returns URL completa para geração do QR Code
   */
  static generate(
    chaveAcesso: string,
    tpAmb: number,
    _dhEmi: string,
    _vNF: number,
    _digVal: string,
    empresa: Empresa,
    fiscalConfig: FiscalConfig,
    _cpfCnpjDest?: string
  ): string {
    // Valida entrada
    if (chaveAcesso.length !== 44) {
      throw new Error(
        `Chave de acesso inválida: deve ter 44 dígitos (recebido: ${chaveAcesso.length})`
      )
    }

    if (![1, 2].includes(tpAmb)) {
      throw new Error(`Tipo de ambiente inválido: deve ser 1 (Produção) ou 2 (Homologação)`)
    }

    if (!empresa.state) {
      throw new Error('UF da empresa não informada')
    }

    // Obtém URL base do QR Code conforme UF e ambiente (NfeConsultaQR)
    const urls = this.QRCODE_URLS[empresa.state.toUpperCase()]
    if (!urls) {
      throw new Error(`UF não suportada para QR Code NFC-e: ${empresa.state}`)
    }

    const urlBase = tpAmb === 1 ? urls.producao : urls.homologacao

    // Versão do QR Code (sempre 2 para NFC-e)
    const versao = '2'

    // CSC (Código de Segurança do Contribuinte)
    // Normaliza cscId: remove zeros à esquerda (XSD exige 0 ou [1-9][0-9]{0,5})
    const rawCscId = fiscalConfig.cscId || '1'
    const cscId = String(Number.parseInt(rawCscId, 10) || 0)
    const cscToken = fiscalConfig.cscToken || ''

    if (!cscToken) {
      throw new Error('CSC Token não configurado. Configure em FiscalConfig.cscToken')
    }

    // ─── QR Code V2 ONLINE (tpEmis = 1, emissão normal) ─────────────
    //
    // Formato conforme NT 2019.001 / XSD leiauteNFe_v4.00:
    //   URL?p=CHAVE44|VERSAO|TPAMB|CSCID|HASHSHA1
    //
    // O pipe '|' é LITERAL (não pode ser %7C).
    // O hash SHA-1 é calculado sobre: chNFe|versao|tpAmb|cscId|cscToken
    // Tudo fica no parâmetro 'p', sem '&c=' separado.

    // String para cálculo do hash (inclui CSC Token no final)
    const hashInput = `${chaveAcesso}|${versao}|${tpAmb}|${cscId}${cscToken}`

    // SHA-1 em uppercase hex (40 chars)
    const cHashQRCode = crypto
      .createHash('sha1')
      .update(hashInput, 'utf8')
      .digest('hex')
      .toUpperCase()

    // Monta URL com pipe literal — NÃO usar URLSearchParams (codifica | como %7C)
    const pValue = `${chaveAcesso}|${versao}|${tpAmb}|${cscId}|${cHashQRCode}`

    return `${urlBase}?p=${pValue}`
  }

  /**
   * Valida se UF possui suporte a QR Code NFC-e
   */
  static isUFSupported(uf: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.QRCODE_URLS, uf.toUpperCase())
  }

  /**
   * Retorna URL base de consulta (urlChave)
   */
  static getConsultaUrl(uf: string, tpAmb: number): string {
    const urls = this.CONSULTA_URLS[uf.toUpperCase()]
    if (!urls) {
      throw new Error(`UF não suportada para QR Code NFC-e: ${uf}`)
    }
    return tpAmb === 1 ? urls.producao : urls.homologacao
  }

  /**
   * Lista todas as UFs suportadas
   */
  static getSupportedUFs(): string[] {
    return Object.keys(this.QRCODE_URLS)
  }
}
