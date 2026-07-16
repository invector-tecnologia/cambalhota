import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Empresa from '#models/empresa'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'

export default class ConfiguracoesController {
  /**
   * Exibe formulário de configuração do usuário
   */
  async editUser({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    return view.render('configuracoes/user', {
      user: user.serialize(),
      empresa: user.empresa.serialize(),
      role: user.role?.serialize(),
    })
  }

  /**
   * Atualiza dados do usuário
   */
  async updateUser({ request, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()

    const validator = vine.compile(
      vine.object({
        fullName: vine.string().minLength(3).maxLength(100),
        email: vine.string().email(),
        cpf: vine.string().optional(),
        phone: vine.string().optional(),
        currentPassword: vine.string().optional(),
        newPassword: vine.string().minLength(6).optional(),
        newPasswordConfirmation: vine.string().optional(),
      })
    )

    const data = await request.validateUsing(validator)

    // Verificar se o email já está em uso por outro usuário
    if (data.email !== user.email) {
      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        session.flash('error', 'Este email já está em uso por outro usuário.')
        return response.redirect().back()
      }
    }

    // Atualizar dados básicos
    user.fullName = data.fullName
    user.email = data.email
    user.cpf = data.cpf || null
    user.phone = data.phone || null

    // Alterar senha se fornecida
    if (data.currentPassword && data.newPassword) {
      // Verificar senha atual
      const isValid = await hash.verify(user.password, data.currentPassword)
      if (!isValid) {
        session.flash('error', 'Senha atual incorreta.')
        return response.redirect().back()
      }

      // Verificar confirmação da nova senha
      if (data.newPassword !== data.newPasswordConfirmation) {
        session.flash('error', 'A confirmação da nova senha não corresponde.')
        return response.redirect().back()
      }

      user.password = data.newPassword
    }

    await user.save()

    session.flash('success', 'Dados atualizados com sucesso!')
    return response.redirect().back()
  }

  /**
   * Exibe formulário de configuração da empresa
   */
  async editEmpresa({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')
    await user.load('role')

    return view.render('configuracoes/empresa', {
      user: user.serialize(),
      empresa: user.empresa.serialize(),
      role: user.role?.serialize(),
    })
  }

  /**
   * Atualiza dados da empresa
   */
  async updateEmpresa({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    await user.load('empresa')

    const validator = vine.compile(
      vine.object({
        razaoSocial: vine.string().minLength(3).maxLength(255),
        tradeName: vine.string().optional(),
        regimeTributario: vine.number().min(1).max(3),
        codMunicipio: vine.string().minLength(7).maxLength(7).optional(),
        cnpj: vine.string().optional(),
        cpf: vine.string().optional(),
        documentType: vine.enum(['cpf', 'cnpj']),
        ie: vine.string().optional(),
        im: vine.string().optional(),
        address: vine.string().minLength(3).maxLength(255),
        addressNumber: vine.string().optional(),
        addressComplement: vine.string().optional(),
        neighborhood: vine.string().minLength(2).maxLength(100),
        city: vine.string().minLength(2).maxLength(100),
        state: vine.string().minLength(2).maxLength(2),
        zipCode: vine.string().minLength(8).maxLength(9),
        phone: vine.string().optional(),
        email: vine.string().email().optional(),
        website: vine.string().optional(),
        notaFiscalFooterMessage: vine.string().optional(),
      })
    )

    const data = await request.validateUsing(validator)

    const empresa = user.empresa

    const sanitizedCnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null
    const sanitizedCpf = data.cpf ? data.cpf.replace(/\D/g, '') : null

    if (sanitizedCnpj && sanitizedCnpj !== empresa.cnpj) {
      const existingEmpresa = await Empresa.query()
        .where('cnpj', sanitizedCnpj)
        .whereNot('id', empresa.id)
        .first()

      if (existingEmpresa) {
        session.flash('error', 'Este CNPJ já está em uso por outra empresa.')
        return response.redirect().back()
      }
    }

    empresa.razaoSocial = data.razaoSocial
    empresa.tradeName = data.tradeName || null
    empresa.regimeTributario = data.regimeTributario
    if (data.documentType === 'cnpj') {
      empresa.cnpj = sanitizedCnpj
      empresa.cpf = null
    } else {
      empresa.cnpj = null
      empresa.cpf = sanitizedCpf
    }
    empresa.documentType = data.documentType
    empresa.ie = data.ie || null
    empresa.im = data.im || null
    empresa.address = data.address
    empresa.addressNumber = data.addressNumber || null
    empresa.addressComplement = data.addressComplement || null
    empresa.neighborhood = data.neighborhood
    empresa.city = data.city
    empresa.state = data.state
    empresa.zipCode = data.zipCode
    empresa.phone = data.phone || null
    empresa.email = data.email || null
    empresa.website = data.website || null
    empresa.notaFiscalFooterMessage = data.notaFiscalFooterMessage || null

    // Buscar código IBGE se não foi fornecido
    if (!data.codMunicipio && data.city && data.state) {
      const { IBGEHelper } = await import('#helpers/ibge_helper')
      empresa.codMunicipio = await IBGEHelper.getCityCode(data.city, data.state)
    } else if (data.codMunicipio) {
      empresa.codMunicipio = data.codMunicipio
    }

    try {
      await empresa.save()
    } catch (error) {
      if (error.code === '23505') {
        session.flash('error', 'Este CNPJ já está em uso por outra empresa.')
        return response.redirect().back()
      }

      logger.error({ err: error }, '[CONFIGURACOES] Erro ao atualizar empresa')
      throw error
    }

    session.flash('success', 'Dados da empresa atualizados com sucesso!')
    return response.redirect().back()
  }
}
