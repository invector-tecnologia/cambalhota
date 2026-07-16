import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('PedidosController - Functional Tests', (group) => {
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

  test('GET /pedidos - deve listar pedidos', async ({ client }) => {
    const response = await client.get('/pedidos').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Pedidos')
  })

  test('GET /pedidos/create - deve mostrar formulário de criação', async ({ client }) => {
    const response = await client.get('/pedidos/create').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Novo Pedido')
  })

  test('GET /cozinha - deve exibir tela da cozinha', async ({ client }) => {
    const response = await client.get('/cozinha').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Cozinha')
  })

  test('POST /pedidos - deve criar novo pedido (sem autenticação deve falhar)', async ({
    client,
  }) => {
    const response = await client.post('/pedidos').json({
      type: 'takeout',
      customerName: 'Cliente Teste',
    })

    response.assertStatus(302) // Redirect para login
  })

  test('deve redirecionar para login se não autenticado', async ({ client }) => {
    const response = await client.get('/pedidos')

    response.assertStatus(302)
    response.assertRedirectsTo('/login')
  })
})
