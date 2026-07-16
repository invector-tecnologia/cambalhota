import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('DashboardController - Functional Tests', (group) => {
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

  test('GET /dashboard - deve mostrar dashboard', async ({ client }) => {
    const response = await client.get('/dashboard').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Dashboard')
  })

  test('GET /dashboard - deve redirecionar se não autenticado', async ({ client }) => {
    const response = await client.get('/dashboard')

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })

  test('GET / - deve redirecionar para dashboard se autenticado', async ({ client }) => {
    const response = await client.get('/').loginAs(user)

    response.assertStatus(302)
    response.assertRedirectsTo('/dashboard')
  })
})
