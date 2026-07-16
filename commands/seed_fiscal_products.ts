import { BaseCommand } from '@adonisjs/core/ace'
import { args } from '@adonisjs/core/ace'
import CardapioProduto from '#models/cardapio_produto'
import { FiscalCodeValidator } from '#helpers/validators/index'

/**
 * Tabela de referência NCM para restaurantes
 * Fonte: Tabela NCM 2024 - Receita Federal
 */
/* const NCM_RESTAURANTE = {
  // Alimentos preparados
  pizza: '19059090', // Pizzas, pães e produtos de padaria
  hamburger: '16025000', // Hambúrguer e produtos de carne
  sanduiche: '19059090', // Sanduíches
  salgado: '19059090', // Salgados diversos
  pastel: '19059090', // Pastéis

  // Bebidas
  refrigerante: '22021000', // Refrigerantes
  agua: '22011000', // Águas minerais
  suco: '22029900', // Sucos
  cerveja: '22030000', // Cerveja
  vinho: '22042100', // Vinhos

  // Cafeteria
  cafe: '21011110', // Café
  cappuccino: '21011110', // Cappuccino
  cha: '09023000', // Chá
  chocolate: '18069000', // Chocolate quente

  // Sobremesas
  sorvete: '21050000', // Sorvetes
  bolo: '19053100', // Bolos
  pudim: '19019000', // Pudins
  mousse: '04051000', // Mousses

  // Outros
  porcao: '19059090', // Porções diversas
  petisco: '19059090', // Petiscos
  entrada: '19059090', // Entradas
} */

/**
 * CFOP - Código Fiscal de Operações
 * 5xxx = Dentro do estado
 * 6xxx = Fora do estado
 */
/* const CFOP_PADRAO = {
  venda_interna: '5102', // Venda dentro do estado
  venda_interestadual: '6102', // Venda fora do estado
  producao_propria: '5405', // Venda de produção própria (restaurante)
} */

/**
 * CSOSN - Código de Situação da Operação do Simples Nacional
 */
/* const CSOSN_SIMPLES = {
  tributada_sem_credito: '102', // Tributada sem permissão de crédito
  isenta: '103', // Isenção do ICMS
  nao_tributada: '400', // Não tributada pelo Simples Nacional
  icms_cobrado: '900', // Outros (com ICMS)
} */

export default class SeedFiscalProducts extends BaseCommand {
  static commandName = 'produtos:seed-fiscal'
  static description = 'Popula produtos com dados fiscais básicos (NCM, CFOP, CST)'

  @args.string({ description: 'ID da empresa' })
  declare empresaId: string

  async run() {
    const empresaId = Number.parseInt(this.empresaId)

    this.logger.info(`Carregando produtos da empresa ${empresaId}...`)
    const produtos = await CardapioProduto.query().where('empresa_id', empresaId)

    if (produtos.length === 0) {
      this.logger.warning('⚠️  Nenhum produto encontrado para esta empresa')
      this.logger.info('Crie produtos primeiro usando o sistema')
      return
    }

    this.logger.info(`\n📦 ${produtos.length} produtos encontrados\n`)

    let atualizados = 0
    let pularTodos = false

    for (const produto of produtos) {
      // Pula produtos que já têm dados fiscais completos
      if (produto.ncm && produto.cfop && produto.cstIcms) {
        this.logger.info(`⏭️  ${produto.name} - Já possui dados fiscais`)
        continue
      }

      this.logger.info(`\n📝 Produto: ${produto.name}`)
      this.logger.info(`   Preço de custo: R$ ${produto.costPrice.toFixed(2)}`)
      this.logger.info(`   Preço de venda: R$ ${produto.salePrice.toFixed(2)}`)

      // Permitir pular todos
      if (!pularTodos) {
        const opcoes = await this.prompt.choice('Escolha uma opção:', [
          { name: '1', message: 'Configurar este produto' },
          { name: '2', message: 'Pular este produto' },
          { name: '3', message: 'Pular todos os próximos' },
        ])

        if (opcoes === '2') continue
        if (opcoes === '3') {
          pularTodos = true
          continue
        }
      } else {
        continue
      }

      // 1. NCM
      if (!produto.ncm) {
        this.logger.info('\n🔢 NCM - Nomenclatura Comum do Mercosul')
        this.logger.info('Sugestões por categoria:')
        this.logger.info('  1. Pizza/Pão: 19059090')
        this.logger.info('  2. Hambúrguer/Carne: 16025000')
        this.logger.info('  3. Refrigerante: 22021000')
        this.logger.info('  4. Água: 22011000')
        this.logger.info('  5. Cerveja: 22030000')
        this.logger.info('  6. Café: 21011110')
        this.logger.info('  7. Sorvete: 21050000')

        const ncm = await this.prompt.ask('Digite o NCM (8 dígitos)', {
          default: '19059090',
          validate: (value) => {
            const validation = FiscalCodeValidator.validateNCM(value)
            if (validation === true) return true
            if (typeof validation === 'object' && validation !== null && 'errors' in validation) {
              return (validation as { errors: string[] }).errors[0] || 'NCM inválido'
            }
            return 'NCM inválido'
          },
        })

        produto.ncm = ncm
      }

      // 2. CFOP
      if (!produto.cfop) {
        this.logger.info('\n📊 CFOP - Código Fiscal de Operações')
        const cfopChoice = await this.prompt.choice('Tipo de operação:', [
          { name: '5102', message: '5102 - Venda dentro do estado (padrão)' },
          { name: '5405', message: '5405 - Venda de produção própria (restaurante)' },
          { name: '6102', message: '6102 - Venda para fora do estado (delivery interestadual)' },
        ])

        produto.cfop = cfopChoice
      }

      // 3. CST/CSOSN (Simples Nacional)
      if (!produto.cstIcms) {
        this.logger.info('\n💰 CSOSN - Código de Situação Tributária (Simples Nacional)')
        const cstChoice = await this.prompt.choice('Situação tributária:', [
          {
            name: '102',
            message: '102 - Tributada pelo Simples Nacional sem permissão de crédito (padrão)',
          },
          { name: '103', message: '103 - Isenção do ICMS no Simples Nacional' },
          { name: '400', message: '400 - Não tributada pelo Simples Nacional' },
        ])

        produto.cstIcms = cstChoice
      }

      // 4. Alíquotas
      if (produto.pisRate === null || produto.pisRate === undefined) {
        this.logger.info('\n📈 Alíquotas de Impostos')
        const pisRate = await this.prompt.ask('Taxa PIS (%)', {
          default: '0.65',
          validate: (value) => !Number.isNaN(Number.parseFloat(value)),
        })
        produto.pisRate = Number.parseFloat(pisRate)
      }

      if (produto.cofinsRate === null || produto.cofinsRate === undefined) {
        const cofinsRate = await this.prompt.ask('Taxa COFINS (%)', {
          default: '3.0',
          validate: (value) => !Number.isNaN(Number.parseFloat(value)),
        })
        produto.cofinsRate = Number.parseFloat(cofinsRate)
      }

      // 5. ICMS (geralmente 0 para Simples Nacional)
      if (produto.icmsRate === null || produto.icmsRate === undefined) {
        produto.icmsRate = 0.0
      }

      // 6. Unidade comercial
      if (!produto.unit) {
        const unitChoice = await this.prompt.choice('Unidade comercial:', [
          { name: 'UN', message: 'UN - Unidade' },
          { name: 'KG', message: 'KG - Quilograma' },
          { name: 'LT', message: 'LT - Litro' },
          { name: 'PC', message: 'PC - Peça' },
          { name: 'CX', message: 'CX - Caixa' },
        ])
        produto.unit = unitChoice
      }

      // 7. Origem
      if (produto.origem === null || produto.origem === undefined) {
        produto.origem = 0 // 0 = Nacional
      }

      // Salvar
      await produto.save()
      atualizados++

      this.logger.success(`✅ ${produto.name} - Dados fiscais atualizados`)
      this.logger.info(`   NCM: ${produto.ncm}`)
      this.logger.info(`   CFOP: ${produto.cfop}`)
      this.logger.info(`   CST: ${produto.cstIcms}`)
      this.logger.info(`   PIS: ${produto.pisRate}%`)
      this.logger.info(`   COFINS: ${produto.cofinsRate}%`)
      this.logger.info(`   Unidade: ${produto.unit}`)
    }

    this.logger.info(`\n✅ Concluído! ${atualizados} produtos atualizados`)

    if (atualizados > 0) {
      this.logger.success('\n🎉 Produtos prontos para emissão de NFC-e!')
    }
  }
}
