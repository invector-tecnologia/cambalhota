import xml2js from 'xml2js'
import Nfe from '#models/nfe'
import NotaFiscalItem from '#models/nota_fiscal_item'
import Supplier from '#models/fornecedor'
import Insumo from '#models/insumo'
import { DateTime } from 'luxon'

interface NfeXmlData {
  accessKey: string
  number: string
  series: string
  model: string
  issueDate: DateTime
  totalValue: number
  productsValue: number
  taxValue: number
  freightValue: number
  discountValue: number
  supplier: {
    cnpj: string
    name: string
    fantasyName?: string
    address: {
      street: string
      number: string
      neighborhood: string
      city: string
      state: string
      zipCode: string
    }
    phone?: string
    email?: string
  }
  items: Array<{
    code?: string
    barcode?: string
    description: string
    ncm?: string
    unit: string
    quantity: number
    unitValue: number
    totalValue: number
    taxValue: number
  }>
}

export default class NfeProcessorService {
  /**
   * Processa XML da NFe e extrai dados estruturados
   */
  static async parseXml(xmlContent: string): Promise<NfeXmlData> {
    try {
      // Parse do XML
      const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true })
      const xml = await parser.parseStringPromise(xmlContent)
      const nfe = xml.nfeProc?.NFe || xml.NFe

      if (!nfe) {
        throw new Error('XML não é uma NFe válida')
      }

      const infNFe = nfe.infNFe
      const ide = infNFe.ide
      const emit = infNFe.emit
      const total = infNFe.total
      const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det]

      // Dados do cabeçalho da NFe
      const accessKey = infNFe.$.Id.replace('NFe', '')
      const issueDate = DateTime.fromFormat(ide.dhEmi, 'yyyy-MM-ddTHH:mm:ssZZ')

      // Dados do fornecedor
      const enderEmit = emit.enderEmit
      const supplierData = {
        cnpj: emit.CNPJ,
        name: emit.xNome,
        fantasyName: emit.xFant || undefined,
        address: {
          street: enderEmit.xLgr,
          number: enderEmit.nro,
          neighborhood: enderEmit.xBairro,
          city: enderEmit.xMun,
          state: enderEmit.UF,
          zipCode: enderEmit.CEP?.replace(/\D/g, '') || '',
        },
        phone: emit.fone || undefined,
        email: emit.email || undefined,
      }

      // Totais da NFe
      const ICMSTot = total.ICMSTot
      const totalValue = Number.parseFloat(ICMSTot.vNF)
      const productsValue = Number.parseFloat(ICMSTot.vProd)
      const taxValue = Number.parseFloat(ICMSTot.vTotTrib || '0')
      const freightValue = Number.parseFloat(ICMSTot.vFrete || '0')
      const discountValue = Number.parseFloat(ICMSTot.vDesc || '0')

      // Itens da NFe
      const items = det.map((item: any) => {
        const prod = item.prod
        const imposto = item.imposto

        return {
          code: prod.cProd || undefined,
          barcode: prod.cEAN && prod.cEAN !== 'SEM GTIN' ? prod.cEAN : undefined,
          description: prod.xProd,
          ncm: prod.NCM || undefined,
          unit: prod.uCom,
          quantity: Number.parseFloat(prod.qCom),
          unitValue: Number.parseFloat(prod.vUnCom),
          totalValue: Number.parseFloat(prod.vProd),
          taxValue: Number.parseFloat(
            imposto?.ICMS?.ICMS00?.vICMS || imposto?.ICMS?.ICMS10?.vICMS || '0'
          ),
        }
      })

      return {
        accessKey,
        number: ide.nNF,
        series: ide.serie,
        model: ide.mod,
        issueDate,
        totalValue,
        productsValue,
        taxValue,
        freightValue,
        discountValue,
        supplier: supplierData,
        items,
      }
    } catch (error) {
      throw new Error(`Erro ao processar XML da NFe: ${error.message}`)
    }
  }

  /**
   * Processa uma NFe completa - cria/atualiza fornecedor, NFe e itens
   */
  static async processNfe(xmlContent: string, companyId: number, userId: number): Promise<Nfe> {
    const xmlData = await this.parseXml(xmlContent)

    // 1. Buscar ou criar fornecedor
    let supplier = await Supplier.query()
      .where('empresa_id', companyId)
      .where('document', xmlData.supplier.cnpj)
      .first()

    if (!supplier) {
      supplier = await Supplier.create({
        empresaId: companyId,
        document: xmlData.supplier.cnpj,
        documentType: 'cnpj',
        name: xmlData.supplier.name,
        tradeName: xmlData.supplier.fantasyName,
        address: xmlData.supplier.address.street,
        addressNumber: xmlData.supplier.address.number,
        neighborhood: xmlData.supplier.address.neighborhood,
        city: xmlData.supplier.address.city,
        state: xmlData.supplier.address.state,
        zipCode: xmlData.supplier.address.zipCode,
        phone: xmlData.supplier.phone,
        email: xmlData.supplier.email,
        active: true,
      })
    } else {
      // Atualizar dados do fornecedor se necessário
      supplier.merge({
        name: xmlData.supplier.name,
        tradeName: xmlData.supplier.fantasyName,
        address: xmlData.supplier.address.street,
        addressNumber: xmlData.supplier.address.number,
        neighborhood: xmlData.supplier.address.neighborhood,
        city: xmlData.supplier.address.city,
        state: xmlData.supplier.address.state,
        zipCode: xmlData.supplier.address.zipCode,
        phone: xmlData.supplier.phone || supplier.phone,
        email: xmlData.supplier.email || supplier.email,
      })
      await supplier.save()
    }

    // 2. Criar NFe
    const nfe = await Nfe.create({
      empresaId: companyId,
      fornecedorId: supplier.id,
      accessKey: xmlData.accessKey,
      number: xmlData.number,
      series: xmlData.series,
      model: xmlData.model,
      issueDate: xmlData.issueDate,
      totalValue: xmlData.totalValue,
      productsValue: xmlData.productsValue,
      taxValue: xmlData.taxValue,
      freightValue: xmlData.freightValue,
      discountValue: xmlData.discountValue,
      status: 'processing',
      xmlContent,
      processedBy: userId,
      processedAt: DateTime.now(),
    })

    // 3. Processar itens da NFe
    for (const itemData of xmlData.items) {
      // Tentar encontrar produto existente
      let product = null
      if (itemData.barcode) {
        product = await Insumo.query()
          .where('empresa_id', companyId)
          .where('barcode', itemData.barcode)
          .first()
      }

      if (!product && itemData.code) {
        product = await Insumo.query()
          .where('empresa_id', companyId)
          .where('code', itemData.code)
          .first()
      }

      if (!product) {
        // Busca por similaridade no nome
        product = await Insumo.query()
          .where('empresa_id', companyId)
          .where('name', 'ilike', `%${itemData.description.substring(0, 20)}%`)
          .first()
      }

      // Criar item da NFe
      const nfeItem = await NotaFiscalItem.create({
        notaFiscalId: nfe.id,
        insumoId: product?.id,
        code: itemData.code,
        barcode: itemData.barcode,
        description: itemData.description,
        ncm: itemData.ncm,
        unit: itemData.unit,
        quantity: itemData.quantity,
        unitValue: itemData.unitValue,
        totalValue: itemData.totalValue,
        taxValue: itemData.taxValue,
        processed: !!product,
        stockUpdated: false,
      })

      // Se não encontrou produto, criar automaticamente
      if (!product) {
        product = await Insumo.create({
          empresaId: companyId,
          code: itemData.code,
          barcode: itemData.barcode,
          name: itemData.description,
          type: 'ingredient', // Padrão
          unit: itemData.unit,
          purchasePrice: itemData.unitValue,
          currentStock: 0,
          minimumStock: 0,
          stockControl: true,
          ncm: itemData.ncm,
          fornecedorPadraoId: supplier.id,
          active: true,
        })

        // Atualizar item com o produto criado
        await nfeItem.linkToSupply(product.id)
      }
    }

    // 4. Marcar NFe como processada
    await nfe.markAsProcessed()

    return nfe
  }

  /**
   * Aplica entrada no estoque baseado nos itens da NFe
   */
  static async applyStockEntry(nfeId: number): Promise<void> {
    const nfe = await Nfe.findOrFail(nfeId)
    await nfe.preload('items')

    for (const item of nfe.items) {
      if (item.insumoId && !item.stockUpdated) {
        // Buscar produto e atualizar estoque
        const product = await Insumo.findOrFail(item.insumoId)
        product.currentStock += item.quantity
        product.purchasePrice = item.unitValue // Atualizar último preço de compra
        await product.save()

        // Marcar item como estoque atualizado
        await item.markStockUpdated()
        await item.addNote(`Entrada de estoque: ${item.quantity} ${item.unit}`)
      }
    }

    // Atualizar data de entrada no estoque
    await nfe.updateStockEntry()
  }
}
