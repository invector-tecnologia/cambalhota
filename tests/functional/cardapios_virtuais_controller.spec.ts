import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import CardapioVirtual from '#models/cardapio_virtual'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('CardapiosVirtuaisController - Functional Tests', (group) => {
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

    await CardapioVirtual.create({
      empresaId: empresa.id,
      title: 'Cardápio Principal',
      slug: 'cardapio-principal',
      theme: 'modern',
      status: 'published',
      publishedAt: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('GET /cardapio-virtual - deve listar cardápios', async ({ client }) => {
    const response = await client.get('/cardapio-virtual').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Cardápios Virtuais')
  })

  test('GET /cardapio/:slug - deve exibir cardápio público', async ({ client }) => {
    const response = await client.get('/cardapio/cardapio-principal')

    response.assertStatus(200)
    response.assertBodyContains('Cardápio Principal')
  })

  test('GET /cardapio/:slug - deve retornar 404 para slug inexistente', async ({ client }) => {
    const response = await client.get('/cardapio/nao-existe')

    response.assertStatus(404)
  })

  test('GET /cardapio-virtual/create - deve mostrar formulário', async ({ client }) => {
    const response = await client.get('/cardapio-virtual/create').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains('Novo Cardápio')
  })
})
