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

test.group('Fluxo Completo Pedido - Integration Tests', (group) => {
  let empresa: Empresa
  let user: User
  let mesa: Mesa
  let comanda: Comanda
  let categoria: CardapioCategoria
  let produto1: CardapioProduto
  let produto2: CardapioProduto

  group.setup(async () => {
    await testUtils.db().truncate()
  })

  group.each.setup(async () => {
    // Setup completo do restaurante
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
      name: 'Comanda 100',
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
      description: 'Frango empanado com fritas',
      costPrice: 15.0,
      salePrice: 24.0,
      markupPercentage: 60,
      active: true,
      available: true,
      sortOrder: 1,
      preparationTime: 30,
      trackStock: false,
      dailySold: 0,
      spiceLevel: 'none',
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      lactoseFree: false,
    })

    produto2 = await CardapioProduto.create({
      empresaId: empresa.id,
      cardapioCategoriaId: categoria.id,
      name: 'Refrigerante',
      description: 'Coca-Cola 350ml',
      costPrice: 2.0,
      salePrice: 5.0,
      markupPercentage: 150,
      active: true,
      available: true,
      sortOrder: 2,
      preparationTime: 2,
      trackStock: false,
      dailySold: 0,
      spiceLevel: 'none',
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      lactoseFree: false,
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('fluxo completo: criar pedido, adicionar itens, confirmar e pagar', async ({ assert }) => {
    // 1. Criar pedido
    const pedido = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      orderNumber: await Pedido.generateNumeroPedido(empresa.id),
      customerName: 'Cliente Teste',
      type: 'dine_in',
      status: 'pending',
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      total: 0,
    })

    assert.equal(pedido.status, 'pending')

    // 2. Adicionar itens ao pedido
    const item1 = await pedido.addItem(produto1.id, 2, 'Bem passado')
    const item2 = await pedido.addItem(produto2.id, 3)

    assert.equal(item1.quantity, 2)
    assert.equal(item1.totalPrice, 48.0) // 24 * 2
    assert.equal(item2.quantity, 3)
    assert.equal(item2.totalPrice, 15.0) // 5 * 3

    // 3. Verificar cálculos
    await pedido.refresh()
    assert.equal(pedido.subtotal, 63.0) // 48 + 15
    assert.equal(pedido.serviceCharge, 6.3) // 10% de 63
    assert.equal(pedido.total, 69.3) // 63 + 6.3

    // 4. Aplicar desconto
    pedido.discount = 9.3
    await pedido.save()
    await pedido.calculateTotals()

    assert.equal(pedido.total, 60.0) // 63 + 6.3 - 9.3

    // 5. Confirmar pedido
    await pedido.confirm()
    assert.equal(pedido.status, 'confirmed')
    assert.exists(pedido.confirmedAt)

    // 6. Iniciar preparo dos itens
    await item1.startPreparing()
    await item2.startPreparing()

    await item1.refresh()
    await item2.refresh()

    assert.equal(item1.status, 'preparing')
    assert.equal(item2.status, 'preparing')
    assert.exists(item1.startedAt)
    assert.exists(item2.startedAt)

    // 7. Marcar itens como prontos
    await item1.markReady()
    await item2.markReady()

    await item1.refresh()
    await item2.refresh()

    assert.equal(item1.status, 'ready')
    assert.equal(item2.status, 'ready')
    assert.exists(item1.preparedAt)
    assert.exists(item2.preparedAt)

    // 8. Marcar pedido como pronto
    await pedido.markReady()
    assert.equal(pedido.status, 'ready')
    assert.exists(pedido.preparedAt)

    // 9. Servir pedido
    await pedido.serve()
    assert.equal(pedido.status, 'served')
    assert.exists(pedido.servedAt)

    // 10. Pagar pedido
    await pedido.pay()
    assert.equal(pedido.status, 'paid')
    assert.exists(pedido.paidAt)
  })

  test('fluxo: cancelar item do pedido', async ({ assert }) => {
    const pedido = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      orderNumber: await Pedido.generateNumeroPedido(empresa.id),
      type: 'dine_in',
      status: 'pending',
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      total: 0,
    })

    await pedido.addItem(produto1.id, 1)
    const item2 = await pedido.addItem(produto2.id, 1)

    await pedido.refresh()
    const totalAntes = pedido.total

    // Cancelar item2
    await item2.cancel()

    assert.equal(item2.status, 'cancelled')
    assert.exists(item2.cancelledAt)

    // Verificar que total foi recalculado
    await pedido.refresh()
    await pedido.calculateTotals()
    assert.isBelow(pedido.total, totalAntes)
  })

  test('fluxo: múltiplos pedidos na mesma comanda', async ({ assert }) => {
    // Primeiro pedido
    const pedido1 = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      orderNumber: await Pedido.generateNumeroPedido(empresa.id),
      type: 'dine_in',
      status: 'pending',
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      total: 0,
    })

    await pedido1.addItem(produto1.id, 1)

    // Segundo pedido (adicional)
    const pedido2 = await Pedido.create({
      empresaId: empresa.id,
      comandaId: comanda.id,
      userId: user.id,
      orderNumber: await Pedido.generateNumeroPedido(empresa.id),
      type: 'dine_in',
      status: 'pending',
      subtotal: 0,
      discount: 0,
      serviceCharge: 0,
      total: 0,
    })

    await pedido2.addItem(produto2.id, 2)

    // Verificar que ambos estão na mesma comanda
    await comanda.load('pedidos' as any)
    assert.lengthOf(comanda.pedidos, 2)

    // Verificar totais independentes
    await pedido1.refresh()
    await pedido2.refresh()

    assert.equal(pedido1.subtotal, 24.0)
    assert.equal(pedido2.subtotal, 10.0) // 5 * 2
  })
})
