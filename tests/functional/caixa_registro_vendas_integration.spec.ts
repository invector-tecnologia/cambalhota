import { test } from '@japa/runner'
import User from '#models/user'
import Empresa from '#models/empresa'
import Mesa from '#models/mesa'
import Comanda from '#models/comanda'
import Pedido from '#models/pedido'
import CardapioCategoria from '#models/cardapio_categoria'
import CardapioProduto from '#models/cardapio_produto'
import CaixaRegistro from '#models/caixa_registro'
import { DateTime } from 'luxon'
import Venda from '#models/venda'
import testUtils from '@adonisjs/core/services/test_utils'

// Teste funcional: ao fechar uma comanda, a venda aparece no caixa do dia

test.group('CaixaRegistro - integração com vendas', (group) => {
  let empresa: Empresa
  let user: User
  let mesa: Mesa
  let comanda: Comanda
  let categoria: CardapioCategoria
  let produto: CardapioProduto
  let pedido: Pedido
  let caixa: CaixaRegistro

  group.setup(async () => {
    await testUtils.db().truncate()
  })

  group.each.setup(async () => {
    empresa = await Empresa.create({ name: 'Empresa Teste', cnpj: '12345678901234', active: true })
    user = await User.create({
      email: 'caixa@tavolo.com',
      password: 'senha123',
      empresaId: empresa.id,
      fullName: 'Caixa Teste',
    })
    mesa = await Mesa.create({
      empresaId: empresa.id,
      number: '1',
      name: 'Mesa 1',
      capacity: 4,
      active: true,
    })
    comanda = await Comanda.create({
      empresaId: empresa.id,
      mesaId: mesa.id,
      number: '200',
      active: true,
    })
    categoria = await CardapioCategoria.create({
      empresaId: empresa.id,
      name: 'Bebidas',
      active: true,
      sortOrder: 1,
    })
    produto = await CardapioProduto.create({
      empresaId: empresa.id,
      cardapioCategoriaId: categoria.id,
      name: 'Água',
      costPrice: 2,
      salePrice: 5,
      active: true,
      available: true,
    })
    pedido = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      status: 'served',
    })
    await pedido.related('items').create({
      cardapioProdutoId: produto.id,
      quantity: 2,
      unitPrice: produto.salePrice,
      totalPrice: produto.salePrice * 2,
      itemName: produto.name,
    })
    // Caixa do dia
    caixa = await CaixaRegistro.create({
      empresaId: empresa.id,
      userId: user.id,
      registerDate: DateTime.now(),
      openingBalance: 100,
      status: 'open',
      openedAt: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('venda aparece no caixa do dia', async ({ assert }) => {
    // Fechar comanda e gerar venda
    const venda = await Venda.createFromComanda(comanda, 'cash', user.id, 0)
    await caixa.updateSalesData()
    await caixa.refresh()
    assert.isAbove(caixa.totalSales, 0)
    assert.equal(caixa.cashSales, venda.total)
    assert.equal(caixa.totalTransactions, 1)
  })
})
