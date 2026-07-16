import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import Mesa from '#models/mesa'
import Comanda from '#models/comanda'
import Pedido from '#models/pedido'
import CardapioCategoria from '#models/cardapio_categoria'
import CardapioProduto from '#models/cardapio_produto'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import Venda from '#models/venda'

test.group('ComandasController - closeAndPay', (group) => {
  let empresa: Empresa
  let user: User
  let mesa: Mesa
  let comanda: Comanda
  let categoria: CardapioCategoria
  let produto1: CardapioProduto
  let produto2: CardapioProduto
  let pedido1: Pedido
  let pedido2: Pedido

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
      email: 'atendente@tavolo.com',
      password: 'senha123',
      empresaId: empresa.id,
      fullName: 'Atendente Teste',
      emailVerifiedAt: DateTime.now(),
    })

    mesa = await Mesa.create({
      empresaId: empresa.id,
      number: '5',
      name: 'Mesa 5',
      capacity: 4,
      active: true,
    })

    comanda = await Comanda.create({
      empresaId: empresa.id,
      mesaId: mesa.id,
      number: '100',
      active: true,
    })

    categoria = await CardapioCategoria.create({
      empresaId: empresa.id,
      name: 'Pratos Principais',
      active: true,
      sortOrder: 1,
    })

    produto1 = await CardapioProduto.create({
      empresaId: empresa.id,
      cardapioCategoriaId: categoria.id,
      name: 'Frango à Milanesa',
      costPrice: 15.0,
      salePrice: 24.0,
      active: true,
      available: true,
    })

    produto2 = await CardapioProduto.create({
      empresaId: empresa.id,
      cardapioCategoriaId: categoria.id,
      name: 'Refrigerante',
      costPrice: 2.0,
      salePrice: 5.0,
      active: true,
      available: true,
    })

    pedido1 = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      status: 'served',
    })
    await pedido1.related('items').create({
      cardapioProdutoId: produto1.id,
      quantity: 2,
      unitPrice: produto1.salePrice,
      totalPrice: produto1.salePrice * 2,
      itemName: produto1.name,
    })

    pedido2 = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      status: 'served',
    })
    await pedido2.related('items').create({
      cardapioProdutoId: produto2.id,
      quantity: 3,
      unitPrice: produto2.salePrice,
      totalPrice: produto2.salePrice * 3,
      itemName: produto2.name,
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('deve fechar a comanda, criar uma venda e marcar os pedidos como pagos', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post(`/comandas/${comanda.id}/close-and-pay`)
      .json({
        paymentMethod: 'cash',
        discount: 0,
      })
      .loginAs(user)

    response.assertStatus(302)
    response.assertRedirectsTo(`/vendas/1`)

    const venda = await Venda.query().where('comanda_id', comanda.id).preload('items').first()
    assert.isNotNull(venda)
    assert.lengthOf(venda!.items, 2)
    assert.equal(venda!.total, 63) // (24 * 2) + (5 * 3)

    await comanda.refresh()
    assert.isFalse(comanda.active)

    await pedido1.refresh()
    await pedido2.refresh()
    assert.equal(pedido1.status, 'paid')
    assert.equal(pedido2.status, 'paid')
  })
})
