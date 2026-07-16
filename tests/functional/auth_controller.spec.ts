import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('AuthController - Functional Tests', (group) => {
  let empresa: Empresa
  let user: User

  group.setup(async () => {
    await testUtils.db().truncate()
  })

  group.each.setup(async () => {
    empresa = await Empresa.create({
      name: 'Restaurante Teste',
      cnpj: '12345678901234',
      active: true,
    })

    user = await User.create({
      email: 'teste@tavolo.com',
      password: 'senha123',
      empresaId: empresa.id,
      emailVerifiedAt: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('GET /login - deve mostrar página de login', async ({ client }) => {
    const response = await client.get('/login')

    response.assertStatus(200)
    response.assertBodyContains('Login')
  })

  test('GET /register - deve mostrar página de registro', async ({ client }) => {
    const response = await client.get('/register')

    response.assertStatus(200)
    response.assertBodyContains('Criar Conta')
  })

  test('POST /logout - deve fazer logout', async ({ client }) => {
    const response = await client.post('/logout').loginAs(user)

    response.assertStatus(302)
    response.assertRedirectsTo('/')
  })

  test('GET /login - deve redirecionar para dashboard se já autenticado', async ({ client }) => {
    const response = await client.get('/login').loginAs(user)

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')
  })
})
