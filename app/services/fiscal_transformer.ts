import { XMLBuilder } from 'fast-xml-parser'
import type Venda from '#models/venda'
import type Empresa from '#models/empresa'
import type FiscalConfig from '#models/fiscal_config'
import {
  getUFCode,
  cleanCNPJ,
  cleanCPF,
  cleanCEP,
  formatMoneyForXML,
  formatDateTimeForSEFAZ,
} from '#helpers/fiscal_formatters'
import { generateAccessKey, isValidAccessKey } from '#helpers/qrcode_generator'
import {
  DocumentValidator,
  IEValidator,
  FiscalCodeValidator,
  TotalizadorValidator,
} from '#helpers/validators/index'
import { IBGEHelper } from '#helpers/ibge_helper'

/**
 * Responsável por transformar uma Venda em objeto compatível com XML da SEFAZ
 * Segue o padrão Manual de Orientação do Contribuinte (MOC 7.0)
 */
export default class FiscalTransformer {
  /**
   * Transforma uma venda em estrutura XML compatível com SEFAZ (NFC-e)
   * Usa dados reais da empresa e produtos de todos os itens da venda
   */
  static async transformToXml(
    venda: Venda,
    empresa: Empresa,
    fiscalConfig: FiscalConfig,
    customerCpf?: string,
    options?: {
      nfeNumber?: number
      tpEmis?: number
      dhCont?: string
      xJust?: string
    }
  ): Promise<string> {
    // Valida CPF do destinatário (se informado)
    if (customerCpf) {
      const cpfValidation = DocumentValidator.validateCPF(customerCpf)
      if (!cpfValidation) {
        throw new Error(`CPF do destinatário inválido`)
      }
    }

    // Valida campos obrigatórios da empresa
    this.validateEmpresaData(empresa)

    // Carrega todos os itens da venda com os produtos do cardápio
    await venda.load('items', (query) => {
      query.preload('cardapioProduto')
    })

    // Valida que há itens na venda
    if (!venda.items || venda.items.length === 0) {
      throw new Error('Venda não possui itens para emitir nota fiscal')
    }

    // Todos os itens da venda
    const allItems = venda.items

    // Valida campos fiscais dos produtos
    for (const item of allItems) {
      this.validateProdutoFiscalData(item.cardapioProduto, empresa.regimeTributario)
    }

    // Calcula totalizadores consolidados
    const totals = this.calculateTotalsFromItems(allItems)

    // Calcula valor total da nota
    const totalAmount = totals.vProd

    // Valida totalizadores com TotalizadorValidator
    const nfeItems = allItems.map((item) => {
      const produto = item.cardapioProduto
      const vProd = item.subtotal // VendaItem usa subtotal
      const csosn = produto.cstIcms || produto.csosn || ''
      const cfop = produto.cfop || ''
      const csosnEfetivo = cfop === '5405' && csosn === '400' ? '500' : csosn
      const csosnSemBC = ['102', '103', '300', '400', '500']
      const temBC = !csosnSemBC.includes(csosnEfetivo)

      const vBC = temBC ? vProd : 0
      const vICMS = temBC ? (vProd * (produto.icmsRate || 0)) / 100 : 0
      const vPIS = (vProd * (produto.pisRate || 0)) / 100
      const vCOFINS = (vProd * (produto.cofinsRate || 0)) / 100

      return {
        vProd,
        vDesc: 0,
        vFrete: 0,
        vSeg: 0,
        vOutro: 0,
        vBC,
        vICMS,
        vBCST: 0,
        vST: 0,
        vIPI: 0,
        vPIS,
        vCOFINS,
      }
    })

    const nfeTotals = {
      vProd: totals.vProd,
      vDesc: 0,
      vFrete: 0,
      vSeg: 0,
      vOutro: 0,
      vBC: totals.vBC,
      vICMS: totals.vICMS,
      vBCST: 0,
      vST: 0,
      vIPI: 0,
      vPIS: totals.vPIS,
      vCOFINS: totals.vCOFINS,
      vNF: totalAmount,
    }

    const totalsValidation = TotalizadorValidator.validateTotals(nfeItems, nfeTotals)
    if (!totalsValidation.valid) {
      throw new Error(`Totalizadores divergentes:\n${totalsValidation.errors.join('\n')}`)
    }

    // Gera código numérico aleatório
    const cnf = this.generateCNF()

    // Data/hora de emissão
    const emissionDate = new Date()
    const dhEmi = formatDateTimeForSEFAZ(emissionDate, empresa.state)
    const serie = fiscalConfig.serie || 1
    const tpEmis = options?.tpEmis ?? 1
    const nfeNumber = options?.nfeNumber ?? fiscalConfig.nextNfeNumber

    if (tpEmis !== 1) {
      if (!options?.dhCont || !options?.xJust) {
        throw new Error('Emissão em contingência exige dhCont e xJust')
      }
    }
    const accessKey = generateAccessKey(
      empresa.state,
      emissionDate,
      empresa.cnpj || '',
      serie,
      nfeNumber,
      cnf,
      tpEmis
    )
    if (!isValidAccessKey(accessKey)) {
      throw new Error('Chave de acesso invalida gerada para a NFC-e')
    }

    // Construção do XML NFC-e seguindo MOC 7.0
    const xmlObject = {
      NFe: {
        '@_xmlns': 'http://www.portalfiscal.inf.br/nfe',
        'infNFe': {
          '@_Id': `NFe${accessKey}`,
          '@_versao': '4.00',
          'ide': {
            cUF: getUFCode(empresa.state), // Código UF (2 dígitos)
            cNF: cnf, // Código numérico aleatório
            natOp: 'VENDA',
            mod: 65, // Modelo 65 = NFC-e
            serie,
            nNF: nfeNumber,
            dhEmi: dhEmi,
            tpNF: 1, // 1 = Saída
            idDest: 1, // 1 = Operação interna
            cMunFG: empresa.codMunicipio, // Código município IBGE
            tpImp: 4, // 4 = DANFE NFC-e
            tpEmis, // 1 = Emissão normal
            cDV: accessKey.slice(-1), // Dígito verificador da chave
            tpAmb: fiscalConfig.isHomologation ? 2 : 1, // 1=Produção, 2=Homologação
            finNFe: 1, // 1 = Normal
            indFinal: 1, // 1 = Consumidor final
            indPres: 1, // 1 = Operação presencial
            procEmi: 0, // 0 = Emissão por aplicativo
            verProc: '1.0.0',
            ...(tpEmis !== 1
              ? {
                  dhCont: options?.dhCont,
                  xJust: options?.xJust,
                }
              : {}),
          },
          'emit': {
            CNPJ: cleanCNPJ(empresa.cnpj || ''),
            xNome: empresa.razaoSocial,
            xFant: empresa.tradeName || empresa.razaoSocial,
            enderEmit: {
              xLgr: empresa.address,
              nro: empresa.addressNumber || 'S/N',
              ...(empresa.addressComplement ? { xCpl: empresa.addressComplement } : {}),
              xBairro: empresa.neighborhood,
              cMun: empresa.codMunicipio,
              xMun: empresa.city,
              UF: empresa.state,
              CEP: cleanCEP(empresa.zipCode),
              cPais: 1058,
              xPais: 'Brasil',
            },
            IE: empresa.ie ? empresa.ie.replace(/\D/g, '') : '',
            CRT: empresa.regimeTributario, // 1=Simples, 2=Simples excesso, 3=Normal
          },
          'dest': this.buildDest(customerCpf),
          'det': allItems.map((item, index) =>
            this.buildDet(item, index + 1, fiscalConfig.isHomologation)
          ),
          'total': {
            ICMSTot: {
              vBC: formatMoneyForXML(totals.vBC),
              vICMS: formatMoneyForXML(totals.vICMS),
              vICMSDeson: '0.00',
              vFCP: '0.00',
              vBCST: '0.00',
              vST: '0.00',
              vFCPST: '0.00',
              vFCPSTRet: '0.00',
              vProd: formatMoneyForXML(totals.vProd),
              vFrete: '0.00',
              vSeg: '0.00',
              vDesc: formatMoneyForXML(0),
              vII: '0.00',
              vIPI: '0.00',
              vIPIDevol: '0.00',
              vPIS: formatMoneyForXML(totals.vPIS),
              vCOFINS: formatMoneyForXML(totals.vCOFINS),
              vOutro: '0.00',
              vNF: formatMoneyForXML(totalAmount),
            },
          },
          'transp': {
            modFrete: 9, // 9 = Sem frete
          },
          'pag': {
            detPag: {
              indPag: 0, // 0 = Pagamento à vista
              tPag: '99', // Outros (definido no fechamento da comanda)
              xPag: 'Outros', // Obrigatório para tPag=99 (cStat=441)
              vPag: formatMoneyForXML(totalAmount),
            },
          },
          'infAdic': {
            infCpl: `Venda #${venda.saleNumber} - NFC-e emitida automaticamente`,
          },
        },
      },
    }

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      suppressEmptyNode: true,
    })

    return builder.build(xmlObject) as string
  }

  /**
   * Valida se empresa tem todos os dados fiscais obrigatórios
   * Usa validadores para garantir integridade dos dados
   */
  private static validateEmpresaData(empresa: Empresa): void {
    const errors: string[] = []

    // Valida CNPJ
    if (!empresa.cnpj) {
      errors.push('CNPJ não cadastrado')
    } else {
      const cnpjValidation = DocumentValidator.validateCNPJ(empresa.cnpj)
      if (!cnpjValidation) {
        errors.push(`CNPJ inválido`)
      }
    }

    // Valida Inscrição Estadual
    if (!empresa.ie) {
      errors.push('Inscrição Estadual não cadastrada')
    } else if (empresa.ie.toUpperCase() !== 'ISENTO' && empresa.state) {
      const ieValidation = IEValidator.validate(empresa.ie, empresa.state)
      if (!ieValidation) {
        errors.push(`Inscrição Estadual inválida para ${empresa.state}`)
      }
    }

    // Valida CEP
    if (!empresa.zipCode) {
      errors.push('CEP não cadastrado')
    } else {
      const cepValidation = DocumentValidator.validateCEP(empresa.zipCode)
      if (!cepValidation) {
        errors.push(`CEP inválido`)
      }
    }

    // Valida UF
    if (!empresa.state) {
      errors.push('Estado (UF) não cadastrado')
    } else if (!IBGEHelper.isValidUF(empresa.state)) {
      errors.push(`UF inválida: ${empresa.state}`)
    }

    // Valida código do município
    if (!empresa.codMunicipio) {
      errors.push('Código IBGE do município não cadastrado')
    } else if (!IBGEHelper.isValidCityCode(empresa.codMunicipio)) {
      errors.push(`Código IBGE do município inválido: ${empresa.codMunicipio}`)
    }

    // Campos obrigatórios básicos
    if (!empresa.razaoSocial) errors.push('Razão Social não cadastrada')
    if (!empresa.address) errors.push('Endereço não cadastrado')
    if (!empresa.addressNumber) errors.push('Número do endereço não cadastrado')
    if (!empresa.neighborhood) errors.push('Bairro não cadastrado')
    if (!empresa.city) errors.push('Cidade não cadastrada')
    if (!empresa.regimeTributario) errors.push('Regime tributário não definido')

    if (errors.length > 0) {
      throw new Error(`Dados fiscais da empresa incompletos:\n${errors.join('\n')}`)
    }
  }

  /**
   * Valida se produto tem todos os dados fiscais obrigatórios
   * Usa validadores para garantir códigos fiscais corretos
   * @param produto - Produto a validar
   * @param regimeTributario - 1=Simples Nacional, 2=Simples Excesso, 3=Regime Normal
   */
  private static validateProdutoFiscalData(produto: any, regimeTributario: number): void {
    const errors: string[] = []
    const produtoNome = produto.name || `ID ${produto.id}`
    const isSimplesNacional = regimeTributario === 1 || regimeTributario === 2

    // Valida NCM
    if (!produto.ncm) {
      errors.push(`Produto "${produtoNome}": NCM não cadastrado`)
    } else {
      const ncmValidation = FiscalCodeValidator.validateNCM(produto.ncm)
      if (!ncmValidation) {
        errors.push(`Produto "${produtoNome}": NCM inválido`)
      }
    }

    // Valida CFOP
    if (!produto.cfop) {
      errors.push(`Produto "${produtoNome}": CFOP não cadastrado`)
    } else {
      const cfopValidation = FiscalCodeValidator.validateCFOP(produto.cfop)
      if (!cfopValidation) {
        errors.push(`Produto "${produtoNome}": CFOP inválido`)
      }
    }

    // Valida CST/CSOSN conforme regime tributário
    if (isSimplesNacional) {
      // Simples Nacional: exige CSOSN
      const csosn = produto.csosn || produto.cstIcms
      if (!csosn) {
        errors.push(`Produto "${produtoNome}": CSOSN não cadastrado (empresa no Simples Nacional)`)
      } else {
        const csosnValidation = FiscalCodeValidator.validateCSOSN(csosn)
        if (!csosnValidation) {
          errors.push(`Produto "${produtoNome}": CSOSN "${csosn}" inválido`)
        }
      }
    } else {
      // Regime Normal: exige CST
      const cst = produto.cstIcms
      if (!cst) {
        errors.push(`Produto "${produtoNome}": CST não cadastrado (empresa no Regime Normal)`)
      } else {
        const cstValidation = FiscalCodeValidator.validateCST(cst)
        if (!cstValidation) {
          errors.push(`Produto "${produtoNome}": CST "${cst}" inválido`)
        }
      }
    }

    // Valida CEST (opcional, mas se informado deve ser válido)
    if (produto.cest) {
      const cestValidation = FiscalCodeValidator.validateCEST(produto.cest)
      if (!cestValidation) {
        errors.push(`Produto "${produtoNome}": CEST inválido`)
      }
    }

    // Valida unidade comercial
    if (!produto.unit) {
      errors.push(`Produto "${produtoNome}": Unidade comercial não cadastrada`)
    }

    if (errors.length > 0) {
      throw new Error(`Dados fiscais dos produtos incompletos:\n${errors.join('\n')}`)
    }
  }

  /**
   * Constrói dados do destinatário
   */
  private static buildDest(customerCpf?: string) {
    const cpf = customerCpf ? cleanCPF(customerCpf) : ''

    if (cpf && cpf.length === 11) {
      return {
        CPF: cpf,
        xNome: 'CONSUMIDOR',
        indIEDest: 9, // 9 = Não Contribuinte
      }
    }

    // Consumidor não identificado
    return undefined
  }

  /**
   * Constrói item da nota (det)
   */
  private static buildDet(item: any, nItem: number, isHomologation?: boolean) {
    const produto = item.cardapioProduto
    const vProd = item.subtotal // VendaItem usa subtotal ao invés de totalPrice
    const vUnCom = item.unitPrice

    // Em homologação, o primeiro item DEVE ter xProd fixo (regra SEFAZ cStat=373)
    const xProd =
      isHomologation && nItem === 1
        ? 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
        : produto.name

    // Calcula impostos do item
    const vBC = vProd // Base de cálculo
    const vICMS = (vProd * (produto.icmsRate || 0)) / 100
    const vPIS = (vProd * (produto.pisRate || 0)) / 100
    const vCOFINS = (vProd * (produto.cofinsRate || 0)) / 100

    return {
      '@_nItem': nItem,
      'prod': {
        cProd: produto.id.toString(),
        cEAN: produto.barcode || 'SEM GTIN',
        xProd: xProd,
        NCM: produto.ncm.replace(/\D/g, ''),
        CEST: produto.cest || undefined,
        CFOP: produto.cfop,
        uCom: produto.unit,
        qCom: formatMoneyForXML(item.quantity),
        vUnCom: formatMoneyForXML(vUnCom),
        vProd: formatMoneyForXML(vProd),
        cEANTrib: produto.barcode || 'SEM GTIN',
        uTrib: produto.unit,
        qTrib: formatMoneyForXML(item.quantity),
        vUnTrib: formatMoneyForXML(vUnCom),
        indTot: 1, // 1 = Compõe total da NF-e
      },
      'imposto': {
        vTotTrib: formatMoneyForXML(vPIS + vCOFINS), // Total aproximado de tributos
        ICMS: this.buildICMS(produto, vBC, vICMS),
        PIS: this.buildPIS(produto, vBC, vPIS),
        COFINS: this.buildCOFINS(produto, vBC, vCOFINS),
      },
    }
  }

  /**
   * Constrói tag ICMS conforme regime tributário
   */
  private static buildICMS(produto: any, vBC: number, vICMS: number) {
    let csosn = produto.cstIcms || produto.csosn
    const pICMS = produto.icmsRate || 0
    const cfop = produto.cfop

    // Correção automática: CFOP 5405 (ST) exige CSOSN 500, não 400
    // Algumas UFs (ex: RJ) rejeitam CSOSN 400 em NFC-e (cStat=384)
    if (cfop === '5405' && csosn === '400') {
      csosn = '500'
    }

    // Para Simples Nacional (CSOSN)
    if (['101', '102', '103', '201', '202', '203', '300', '400', '500', '900'].includes(csosn)) {
      // CSOSN 500 usa tag ICMSSN500
      // O grupo vBCSTRet/pST/vICMSSubstituto/vICMSSTRet é minOccurs="0" no XSD
      // Para NFC-e sem ST efetiva, omitir o grupo evita erros de schema
      if (csosn === '500') {
        return {
          ICMSSN500: {
            orig: produto.origem || 0,
            CSOSN: '500',
          },
        }
      }

      return {
        ICMSSN102: {
          orig: produto.origem || 0,
          CSOSN: csosn,
        },
      }
    }

    // Para Regime Normal (CST)
    return {
      ICMS00: {
        orig: produto.origem || 0,
        CST: csosn,
        modBC: 0,
        vBC: formatMoneyForXML(vBC),
        pICMS: formatMoneyForXML(pICMS),
        vICMS: formatMoneyForXML(vICMS),
      },
    }
  }

  /**
   * Constrói tag PIS
   */
  private static buildPIS(produto: any, vBC: number, vPIS: number) {
    const pPIS = produto.pisRate || 0

    if (pPIS === 0) {
      return {
        PISNT: {
          CST: '04', // 04 = Operação Tributável (tributação monofásica, alíquota zero)
        },
      }
    }

    return {
      PISAliq: {
        CST: '01', // 01 = Operação Tributável (base de cálculo = valor da operação)
        vBC: formatMoneyForXML(vBC),
        pPIS: formatMoneyForXML(pPIS),
        vPIS: formatMoneyForXML(vPIS),
      },
    }
  }

  /**
   * Constrói tag COFINS
   */
  private static buildCOFINS(produto: any, vBC: number, vCOFINS: number) {
    const pCOFINS = produto.cofinsRate || 0

    if (pCOFINS === 0) {
      return {
        COFINSNT: {
          CST: '04', // 04 = Operação Tributável (tributação monofásica, alíquota zero)
        },
      }
    }

    return {
      COFINSAliq: {
        CST: '01', // 01 = Operação Tributável (base de cálculo = valor da operação)
        vBC: formatMoneyForXML(vBC),
        pCOFINS: formatMoneyForXML(pCOFINS),
        vCOFINS: formatMoneyForXML(vCOFINS),
      },
    }
  }

  /**
   * Calcula totalizadores da nota a partir de uma lista de itens
   */
  private static calculateTotalsFromItems(items: any[]) {
    let vProd = 0
    let vBC = 0
    let vICMS = 0
    let vPIS = 0
    let vCOFINS = 0

    for (const item of items) {
      const produto = item.cardapioProduto
      const itemTotal = item.subtotal // VendaItem usa subtotal ao invés de totalPrice

      vProd += itemTotal

      // CSOSN que NÃO geram BC de ICMS (Simples Nacional)
      // 102/103/300/400/500 = sem tributação ou ST já cobrado
      const csosn = produto.cstIcms || produto.csosn
      const cfop = produto.cfop
      const csosnSemBC = ['102', '103', '300', '400', '500']

      // Correção: CFOP 5405 com CSOSN 400 é tratado como 500
      const csosnEfetivo = cfop === '5405' && csosn === '400' ? '500' : csosn

      if (!csosnSemBC.includes(csosnEfetivo)) {
        vBC += itemTotal
        vICMS += (itemTotal * (produto.icmsRate || 0)) / 100
      }

      vPIS += (itemTotal * (produto.pisRate || 0)) / 100
      vCOFINS += (itemTotal * (produto.cofinsRate || 0)) / 100
    }

    return { vProd, vBC, vICMS, vPIS, vCOFINS }
  }

  /**
   * Gera um CNF aleatório (Código Numérico do Formulário)
   */
  private static generateCNF(): string {
    return Math.floor(Math.random() * 99999999)
      .toString()
      .padStart(8, '0')
  }
}
