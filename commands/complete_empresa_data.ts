import { BaseCommand } from '@adonisjs/core/ace'
import { args } from '@adonisjs/core/ace'
import Empresa from '#models/empresa'
import { IBGEHelper } from '#helpers/ibge_helper'
import { DocumentValidator } from '#helpers/validators/document_validator'

export default class CompleteEmpresaData extends BaseCommand {
  static commandName = 'empresa:complete-data'
  static description = 'Completa dados fiscais obrigatórios da empresa'

  @args.string({ description: 'ID da empresa' })
  declare empresaId: string

  async run() {
    const empresaId = Number.parseInt(this.empresaId)

    this.logger.info(`Carregando empresa ${empresaId}...`)
    const empresa = await Empresa.findOrFail(empresaId)

    this.logger.info(`\n📋 Dados atuais da empresa: ${empresa.razaoSocial || empresa.id}`)
    this.logger.info(`CNPJ: ${empresa.cnpj || '❌ NÃO CADASTRADO'}`)
    this.logger.info(`Razão Social: ${empresa.razaoSocial || '❌ NÃO CADASTRADA'}`)
    this.logger.info(`IE: ${empresa.ie || '❌ NÃO CADASTRADA'}`)
    this.logger.info(`Cidade: ${empresa.city}, ${empresa.state}`)
    this.logger.info(`Cód. Município IBGE: ${empresa.codMunicipio || '❌ NÃO CADASTRADO'}`)

    // 1. Validar CNPJ
    if (empresa.cnpj) {
      const isValidCNPJ = DocumentValidator.validateCNPJ(empresa.cnpj)
      if (!isValidCNPJ) {
        this.logger.error('❌ CNPJ inválido')
        return
      }
      this.logger.success('✅ CNPJ válido')
    } else {
      this.logger.error('❌ CNPJ não cadastrado')
      return
    }

    // 2. Completar Razão Social
    if (!empresa.razaoSocial) {
      this.logger.warning('⚠️  Razão Social não cadastrada')
      const razaoSocial = await this.prompt.ask('Digite a Razão Social completa da empresa', {
        default: empresa.razaoSocial || '',
      })
      empresa.razaoSocial = razaoSocial
      this.logger.success(`✅ Razão Social definida: ${razaoSocial}`)
    }

    // 3. Completar Inscrição Estadual
    if (!empresa.ie) {
      this.logger.warning('⚠️  Inscrição Estadual não cadastrada')
      const ie = await this.prompt.ask(`Digite a IE da empresa (${empresa.state}) ou "ISENTO"`, {
        default: 'ISENTO',
      })
      empresa.ie = ie.toUpperCase()
      this.logger.success(`✅ IE definida: ${empresa.ie}`)
    }

    // 4. Buscar Código IBGE do Município
    if (!empresa.codMunicipio && empresa.city && empresa.state) {
      this.logger.info(`\n🔍 Buscando código IBGE para ${empresa.city}/${empresa.state}...`)

      const codigo = await IBGEHelper.getCityCode(empresa.city, empresa.state)

      if (codigo) {
        empresa.codMunicipio = codigo
        this.logger.success(`✅ Código IBGE encontrado: ${codigo}`)
      } else {
        this.logger.warning(`⚠️  Código não encontrado. Buscando cidades similares...`)

        const cidades = await IBGEHelper.searchCities(empresa.city, empresa.state, 5)

        if (cidades.length > 0) {
          this.logger.info('\n📍 Cidades encontradas:')
          cidades.forEach((c, i) => {
            this.logger.info(`  ${i + 1}. ${c.nome}/${c.uf} - Código: ${c.codigo}`)
          })

          const choice = await this.prompt.choice(
            'Selecione a cidade correta',
            cidades.map((c, i) => ({
              name: `${i + 1}`,
              message: `${c.nome}/${c.uf} (${c.codigo})`,
            }))
          )

          const selectedCity = cidades[Number.parseInt(choice) - 1]
          empresa.codMunicipio = selectedCity.codigo
          empresa.city = selectedCity.nome
          empresa.state = selectedCity.uf

          this.logger.success(`✅ Cidade atualizada: ${selectedCity.nome}/${selectedCity.uf}`)
          this.logger.success(`✅ Código IBGE: ${selectedCity.codigo}`)
        } else {
          this.logger.error('❌ Nenhuma cidade encontrada. Verifique o nome da cidade.')
          return
        }
      }
    }

    // 5. Validar endereço completo
    const camposFaltantes: string[] = []
    if (!empresa.address) camposFaltantes.push('Logradouro (address)')
    if (!empresa.addressNumber) camposFaltantes.push('Número (address_number)')
    if (!empresa.neighborhood) camposFaltantes.push('Bairro (neighborhood)')
    if (!empresa.zipCode) camposFaltantes.push('CEP (zip_code)')

    if (camposFaltantes.length > 0) {
      this.logger.warning('\n⚠️  Campos de endereço faltantes:')
      camposFaltantes.forEach((campo) => this.logger.warning(`  - ${campo}`))

      const continuar = await this.prompt.confirm('Deseja cadastrar o endereço completo agora?')

      if (continuar) {
        if (!empresa.address) {
          empresa.address = await this.prompt.ask('Logradouro (Rua, Av, etc)')
        }
        if (!empresa.addressNumber) {
          empresa.addressNumber = await this.prompt.ask('Número', { default: 'S/N' })
        }
        if (!empresa.neighborhood) {
          empresa.neighborhood = await this.prompt.ask('Bairro')
        }
        if (!empresa.zipCode) {
          empresa.zipCode = await this.prompt.ask('CEP (formato: 00000-000)')
        }
        empresa.addressComplement = await this.prompt.ask('Complemento (opcional)', {
          default: '',
        })
      }
    }

    // 6. Salvar alterações
    this.logger.info('\n💾 Salvando alterações...')
    await empresa.save()

    // 7. Mostrar resumo final
    this.logger.info('\n✅ Dados da empresa atualizados com sucesso!\n')
    this.logger.info('📋 RESUMO FINAL:')
    this.logger.info(`Razão Social: ${empresa.razaoSocial}`)
    this.logger.info(`CNPJ: ${empresa.cnpj}`)
    this.logger.info(`IE: ${empresa.ie}`)
    this.logger.info(`Endereço: ${empresa.address}, ${empresa.addressNumber}`)
    this.logger.info(`Bairro: ${empresa.neighborhood}`)
    this.logger.info(`Cidade: ${empresa.city}/${empresa.state}`)
    this.logger.info(`Código IBGE: ${empresa.codMunicipio}`)
    this.logger.info(`CEP: ${empresa.zipCode}`)
    this.logger.info(
      `Regime Tributário: ${empresa.regimeTributario === 1 ? 'Simples Nacional' : 'Normal'}`
    )

    this.logger.success('\n🎉 Empresa pronta para emissão de NFC-e!')
  }
}
