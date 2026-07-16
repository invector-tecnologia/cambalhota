import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import vine from '@vinejs/vine'
import mail from '@adonisjs/mail/services/main'
import string from '@adonisjs/core/helpers/string'
import cloudLogger from '#services/cloud_logger'

export default class AuthController {
  /**
   * Exibir página de login
   */
  async showLogin({ view, response }: HttpContext) {
    try {
      const html = await view.render('auth/login')
      return response.type('text/html').send(html)
    } catch (error) {
      console.error('Erro ao renderizar a tela de login:', error)
      return response.status(500).send('Erro ao carregar a tela de login')
    }
  }

  /**
   * Processar login
   */
  async login({ request, auth, response, session, logger }: HttpContext) {
    const loginSchema = vine.object({
      email: vine.string().email(),
      password: vine.string().minLength(6),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: loginSchema,
        data: rawData,
      })

      const user = await User.verifyCredentials(data.email, data.password)

      // Verificar se usuário está ativo
      if (!user.isActive) {
        await user.load('empresa')
        cloudLogger.warn('LOGIN_INACTIVE_USER', {
          email: data.email,
          userId: user.id,
          cnpj: user.empresa?.cnpj,
        })
        session.flash('error', 'Usuário inativo. Entre em contato com o administrador.')
        return response.redirect().back()
      }

      // Carregar relacionamentos
      await user.load('empresa')
      await user.load('role')

      // Verificar se empresa está ativa
      if (!user.empresa.active) {
        cloudLogger.warn('LOGIN_INACTIVE_COMPANY', {
          email: data.email,
          userId: user.id,
          empresaId: user.empresa.id,
          cnpj: user.empresa.cnpj,
        })
        session.flash('error', 'Empresa inativa. Entre em contato com o suporte.')
        return response.redirect().back()
      }

      await auth.use('web').login(user)

      // Carregar tema do usuário na sessão
      session.put('theme', user.theme)

      cloudLogger.info('LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        empresaId: user.empresaId,
        cnpj: user.empresa.cnpj,
      })

      session.flash('success', `Bem-vindo, ${user.fullName}!`)
      return response.redirect().toRoute('dashboard.index')
    } catch (error) {
      logger.error(`[LOGIN] Erro: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
      cloudLogger.error('LOGIN_FAILED', { error: error.message || String(error) })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', 'Email ou senha incorretos.')
      return response.redirect().back()
    }
  }

  /**
   * Processar logout
   */
  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('auth.login')
  }

  /**
   * Exibir página de registro (apenas para setup inicial)
   */
  async showRegister({ view, response }: HttpContext) {
    try {
      const html = await view.render('auth/register')
      return response.type('text/html').send(html)
    } catch (error) {
      console.error('Erro ao renderizar a tela de cadastro:', error)
      return response.status(500).send('Erro ao carregar a tela de cadastro')
    }
  }

  /**
   * Processar registro inicial (primeiro usuário admin)
   */
  async register({ request, auth, response, session, logger }: HttpContext) {
    const registerSchema = vine.object({
      // Empresa
      razao_social: vine.string().minLength(2),
      empresa_trade_name: vine.string().optional(),
      cnpj: vine.string().minLength(14).maxLength(18),
      ie: vine.string().optional(),
      im: vine.string().optional(),
      address: vine.string(),
      address_number: vine.string().optional(),
      address_complement: vine.string().optional(),
      neighborhood: vine.string(),
      city: vine.string(),
      state: vine.string(),
      zip_code: vine.string(),
      empresa_phone: vine.string().optional(),
      empresa_email: vine.string().email().optional(),
      empresa_website: vine.string().optional(),
      // User
      full_name: vine.string().minLength(2),
      cpf: vine.string().optional(),
      user_phone: vine.string().optional(),
      birth_date: vine.date({ formats: ['YYYY-MM-DD', 'DD/MM/YYYY'] }).optional(),
      email: vine.string().email(),
      password: vine.string().minLength(6).confirmed(),
    })

    try {
      const rawData = request.all()

      const data = await vine.validate({
        schema: registerSchema,
        data: rawData,
      })

      // Verificar se já existe empresa com este CNPJ
      const { default: Empresa } = await import('#models/empresa')
      const existingEmpresa = await Empresa.query()
        .where('cnpj', data.cnpj.replace(/\D/g, ''))
        .first()

      if (existingEmpresa) {
        session.flash('error', 'Sistema já foi configurado. Faça login.')
        return response.redirect().toRoute('auth.login')
      }

      // Criar empresa
      const empresa = await Empresa.create({
        razaoSocial: data.razao_social,
        tradeName: data.empresa_trade_name,
        cnpj: data.cnpj.replace(/\D/g, ''),
        ie: data.ie,
        im: data.im,
        address: data.address,
        addressNumber: data.address_number,
        addressComplement: data.address_complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.empresa_phone,
        email: data.empresa_email,
        website: data.empresa_website,
        active: true,
      })

      // Buscar role admin
      const { default: Role } = await import('#models/role')
      const adminRole = await Role.findByOrFail('name', 'admin')

      // Criar usuário admin
      const user = await User.create({
        fullName: data.full_name,
        email: data.email,
        password: data.password,
        cpf: data.cpf,
        phone: data.user_phone,
        birthDate: data.birth_date ? DateTime.fromJSDate(data.birth_date) : null,
        empresaId: empresa.id,
        roleId: adminRole.id,
        status: 'active',
        emailVerified: false,
        verificationToken: string.random(64),
        verificationTokenExpiresAt: DateTime.now().plus({ hours: 24 }),
      })

      await user.load('empresa')
      await user.load('role')

      // Enviar email de boas-vindas com link de verificação
      try {
        await mail.send((message) => {
          message
            .to(user.email)
            .from('bernardo@invector.com.br', 'TAVOLO - Sistema de Gestão')
            .subject('Bem-vindo ao TAVOLO - Confirme seu email')
            .htmlView('emails/welcome', {
              user,
              empresa,
              verificationUrl: `${process.env.APP_URL}/verify-email/${user.verificationToken}`,
            })
        })
      } catch (emailError) {
        // Não bloqueia o registro se falhar o envio do email
      }

      await auth.use('web').login(user)

      cloudLogger.info('REGISTER_SUCCESS', {
        userId: user.id,
        email: user.email,
        empresaId: empresa.id,
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj,
      })

      session.flash(
        'success',
        `Empresa ${empresa.razaoSocial} criada com sucesso! Verifique seu email para confirmar sua conta.`
      )
      return response.redirect().toRoute('dashboard.index')
    } catch (error) {
      logger.error(`[REGISTER] Erro: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
      cloudLogger.error('REGISTER_FAILED', { error: error.message || String(error) })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      // Debug detalhado para erros de validação
      if (error.code === 'E_VALIDATION_ERROR') {
        // Buscar o primeiro erro específico
        if (error.messages) {
          const firstError = Object.values(error.messages).flat()[0]
          session.flash('error', `Erro de validação: ${firstError}`)
        } else {
          session.flash('error', 'Dados do formulário inválidos. Verifique todos os campos.')
        }
      } else {
        session.flash('error', 'Erro ao criar conta. Verifique os dados.')
      }

      return response.redirect().back()
    }
  }

  /**
   * Exibir formulário de recuperação de senha
   */
  async showForgotPassword({ view }: HttpContext) {
    return view.render('auth/forgot_password')
  }

  /**
   * Processar recuperação de senha
   */
  async forgotPassword({ request, response, session }: HttpContext) {
    const forgotSchema = vine.object({
      email: vine.string().email(),
    })

    try {
      const data = await vine.validate({
        schema: forgotSchema,
        data: request.all(),
      })

      // Buscar usuário
      const user = await User.query().where('email', data.email).first()

      // Sempre retorna sucesso (por segurança, não revela se email existe)
      if (!user) {
        session.flash('success', 'Se o email existir, você receberá uma nova senha.')
        return response.redirect().toRoute('auth.login')
      }

      // Gerar nova senha aleatória
      const newPassword = string.random(12)

      // Atualizar senha do usuário
      user.password = newPassword
      await user.save()

      // Enviar email com nova senha
      await mail.send((message) => {
        message
          .to(user.email)
          .from('bernardo@invector.com.br', 'TAVOLO - Sistema de Gestão')
          .subject('Recuperação de Senha - TAVOLO')
          .htmlView('emails/forgot_password', { user, newPassword })
      })

      session.flash('success', 'Uma nova senha foi enviada para seu email.')
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      console.error('Erro ao recuperar senha:', error)
      session.flash('error', 'Erro ao processar solicitação. Tente novamente.')
      return response.redirect().back()
    }
  }

  /**
   * Verificar email do usuário
   */
  async verifyEmail({ params, response, session }: HttpContext) {
    try {
      const { token } = params

      // Buscar usuário pelo token
      const user = await User.query()
        .where('verification_token', token)
        .where('verification_token_expires_at', '>', DateTime.now().toSQL())
        .first()

      if (!user) {
        session.flash('error', 'Link de verificação inválido ou expirado.')
        return response.redirect().toRoute('auth.login')
      }

      // Verificar email
      user.emailVerified = true
      user.emailVerifiedAt = DateTime.now()
      user.verificationToken = null
      user.verificationTokenExpiresAt = null
      await user.save()

      session.flash('success', 'Email verificado com sucesso! Sua conta está ativa.')
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      console.error('Erro ao verificar email:', error)
      session.flash('error', 'Erro ao verificar email. Tente novamente.')
      return response.redirect().toRoute('auth.login')
    }
  }

  /**
   * Reenviar email de verificação
   */
  async resendVerification({ auth, response, session }: HttpContext) {
    try {
      const user = auth.user!

      if (user.emailVerified) {
        session.flash('info', 'Seu email já está verificado.')
        return response.redirect().back()
      }

      // Gerar novo token
      user.verificationToken = string.random(64)
      user.verificationTokenExpiresAt = DateTime.now().plus({ hours: 24 })
      await user.save()

      // Enviar email
      await user.load('empresa')

      const verificationUrl = `${process.env.APP_URL}/verify-email/${user.verificationToken}`

      await mail.send((message) => {
        message
          .to(user.email)
          .from('bernardo@invector.com.br', 'TAVOLO - Sistema de Gestão')
          .subject('Confirme seu email - TAVOLO')
          .htmlView('emails/welcome', {
            user,
            empresa: user.empresa,
            verificationUrl,
          })
      })

      session.flash('success', 'Email de verificação reenviado com sucesso!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao reenviar email. Tente novamente.')
      return response.redirect().back()
    }
  }
}
