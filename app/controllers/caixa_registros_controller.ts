import type { HttpContext } from '@adonisjs/core/http'
import CaixaRegistro from '#models/caixa_registro'
import Venda from '#models/venda'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { extractCount, extractSum } from '#helpers/db_agg'
import { parseBRToNumber } from '#helpers/number_formatter'
import { resolveUserTimezone } from '#helpers/timezone'
import cloudLogger from '#services/cloud_logger'

export default class CaixaRegistrosController {
  /**
   * Lista os registros de caixa
   */
  async index({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const status = request.input('status', '')
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const month = request.input('month', DateTime.now().setZone(timezone).toFormat('yyyy-MM'))

    let query = CaixaRegistro.query().where('empresa_id', user.empresaId).preload('user')

    if (status) {
      query = query.where('status', status)
    }

    if (month) {
      const startOfMonth = DateTime.fromFormat(month, 'yyyy-MM', { zone: timezone }).startOf(
        'month'
      )
      const endOfMonth = startOfMonth.endOf('month')
      query = query
        .where('register_date', '>=', startOfMonth.toISODate()!)
        .where('register_date', '<=', endOfMonth.toISODate()!)
    }

    const registros = await query.orderBy('register_date', 'desc').paginate(page, 20)

    return view.render('caixa/index', {
      registros: registros.serialize(),
      filters: { status, month },
    })
  }

  /**
   * Exibe o caixa atual ou formulário para abrir
   */
  async current({ view, auth }: HttpContext) {
    const user = await auth.authenticate()
    const currentRegister = await CaixaRegistro.query()
      .where('empresa_id', user.empresaId)
      .where('status', 'open')
      .orderBy('register_date', 'desc')
      .preload('user')
      .first()

    // Buscar vendas do dia se o caixa estiver aberto
    let todaySales: Venda[] = []
    if (currentRegister) {
      const registerDate = currentRegister.registerDate.toISODate()
      if (registerDate) {
        todaySales = await Venda.query()
          .where('empresa_id', user.empresaId)
          .whereRaw('DATE(sale_date) = ?', [registerDate])
          .preload('user')
          .preload('comanda', (query) => query.preload('mesa'))
          .orderBy('sale_date', 'desc')
      }
    }

    let sales = 0
    let profit = 0
    let transactions = 0
    let cost = 0
    let margin = 0
    let averageTicket = 0
    let expected = 0
    let cashSales = 0
    let cardSales = 0
    let pixSales = 0

    if (currentRegister) {
      // const registerDate = currentRegister.registerDate.toISODate()
      // Calcular valores em tempo real das vendas, não do cache
      cashSales = todaySales
        .filter((s) => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + Number(s.total), 0)

      cardSales = todaySales
        .filter((s) => s.paymentMethod === 'card')
        .reduce((sum, s) => sum + Number(s.total), 0)

      pixSales = todaySales
        .filter((s) => s.paymentMethod === 'pix')
        .reduce((sum, s) => sum + Number(s.total), 0)

      sales = cashSales + cardSales + pixSales
      profit = todaySales.reduce((sum, s) => sum + Number(s.profit), 0)
      cost = todaySales.reduce((sum, s) => sum + Number(s.costTotal), 0)
      transactions = todaySales.length
      margin = sales > 0 ? (profit / sales) * 100 : 0
      averageTicket = transactions > 0 ? sales / transactions : 0
      expected = Number.parseFloat(String(currentRegister.openingBalance || 0)) + cashSales
    }

    return view.render('caixa/current', {
      currentRegister: currentRegister?.serialize(),
      todaySales: todaySales.map((s) => s.serialize()),
      sales,
      profit,
      transactions,
      cost,
      margin,
      averageTicket,
      expected,
      cashSales,
      cardSales,
      pixSales,
    })
  }

  /**
   * Abre o caixa
   */
  async open({ request, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    try {
      // const rawData = request.all()

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            openingBalance: vine.string().transform((value) => parseBRToNumber(value) ?? 0),
          })
        )
      )

      const registro = await CaixaRegistro.openRegister(
        user.empresaId,
        user.id,
        data.openingBalance,
        timezone
      )

      await user.load('empresa')
      cloudLogger.info('CAIXA_OPENED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa.cnpj,
        openingBalance: data.openingBalance,
        registroId: registro.id,
      })

      session.flash('success', 'Caixa aberto com sucesso!')
      return response.redirect().toRoute('cashRegisters.current')
    } catch (error) {
      logger.error(
        `[OPEN CAIXA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      await user.load('empresa')
      cloudLogger.error('CAIXA_OPEN_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa.cnpj,
        error: error.message || String(error),
      })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', error.message)
      return response.redirect().back()
    }
  }

  /**
   * Fecha o caixa
   */
  async close({ request, params, response, session, auth, logger }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)

    const registro = await CaixaRegistro.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!registro) {
      return response.notFound('Registro de caixa não encontrado')
    }

    try {
      // const rawData = request.all()

      const data = await request.validateUsing(
        vine.compile(
          vine.object({
            closingBalance: vine.number().min(0),
            notes: vine.string().optional(),
          })
        )
      )

      await registro.closeRegister(data.closingBalance, data.notes, timezone)

      await user.load('empresa')
      cloudLogger.info('CAIXA_CLOSED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa.cnpj,
        registroId: registro.id,
        closingBalance: data.closingBalance,
        totalSales: registro.totalSales,
      })

      session.flash('success', 'Caixa fechado com sucesso!')
      return response.redirect().toRoute('cashRegisters.show', [registro.id])
    } catch (error) {
      logger.error(
        `[CLOSE CAIXA] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`
      )
      await user.load('empresa')
      cloudLogger.error('CAIXA_CLOSE_FAILED', {
        userId: user.id,
        empresaId: user.empresaId,
        cnpj: user.empresa.cnpj,
        registroId: registro.id,
        error: error.message || String(error),
      })

      if (error.messages) {
        session.flash('errors', error.messages)
      }

      session.flash('error', error.message)
      return response.redirect().back()
    }
  }

  /**
   * Exibe um registro de caixa específico
   */
  async show({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const registro = await CaixaRegistro.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('user')
      .first()

    if (!registro) {
      return response.notFound('Registro de caixa não encontrado')
    }

    const sales = await Venda.query()
      .where('empresa_id', user.empresaId)
      .whereRaw('DATE(sale_date) = ?', [registro.registerDate.toISODate() ?? ''])
      .preload('user')
      .preload('comanda', (query) => query.preload('mesa'))
      .orderBy('sale_date', 'desc')

    // Estatísticas detalhadas por método de pagamento
    const paymentStatsResult = await Venda.query()
      .where('empresa_id', user.empresaId)
      .whereRaw('DATE(sale_date) = ?', [registro.registerDate.toISODate() ?? ''])
      .select('payment_method')
      .sum('total as total')
      .sum('profit as profit')
      .count('* as transactions')
      .groupBy('payment_method')
      .orderBy('payment_method')

    const paymentStats = paymentStatsResult.map((p) => {
      const total = extractSum([p], 'total')
      const statProfit = extractSum([p], 'profit')
      const trans = extractCount([p])
      const avg = trans > 0 ? total / trans : 0
      return {
        paymentMethod: (p as any).paymentMethod ?? (p as any).$extras?.payment_method ?? 'unknown',
        total,
        statProfit,
        trans,
        avg,
      }
    })

    const totalSales = registro.totalSales || 0
    const profit = registro.totalProfit || 0
    const cost = registro.totalCost || 0
    const transactions = registro.totalTransactions || 0
    const averageTicket = transactions > 0 ? totalSales / transactions : 0
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0
    const openingBalance = Number.parseFloat(String(registro.openingBalance || 0))
    const cashSales = Number.parseFloat(String(registro.cashSales || 0))
    const closingBalance =
      registro.closingBalance !== null && registro.closingBalance !== undefined
        ? Number.parseFloat(String(registro.closingBalance))
        : null
    const expected = openingBalance + cashSales
    const difference = closingBalance !== null ? closingBalance - expected : 0

    return view.render('caixa/show', {
      registro: registro.serialize(),
      sales: sales.map((s) => s.serialize()),
      paymentStats: paymentStats,
      totalSales,
      profit,
      cost,
      transactions,
      averageTicket,
      margin,
      expected,
      difference,
    })
  }

  /**
   * Atualiza os dados de vendas do caixa
   */
  async updateSales({ params, response, session, auth }: HttpContext) {
    const user = await auth.authenticate()

    const registro = await CaixaRegistro.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .first()

    if (!registro) {
      return response.notFound('Registro de caixa não encontrado')
    }

    try {
      await registro.updateSalesData()
      await registro.save()
      session.flash('success', 'Dados de vendas atualizados!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Erro ao atualizar dados de vendas.')
      return response.redirect().back()
    }
  }

  /**
   * Relatório de movimento de caixa
   */
  async movement({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const dateFrom = request.input(
      'date_from',
      DateTime.now().setZone(timezone).startOf('month').toISODate()
    )
    const dateTo = request.input('date_to', DateTime.now().setZone(timezone).toISODate())

    const registros = await CaixaRegistro.query()
      .where('empresa_id', user.empresaId)
      .where('register_date', '>=', dateFrom!)
      .where('register_date', '<=', dateTo!)
      .preload('user')
      .orderBy('register_date', 'desc')

    // Totais do período
    const totalSales = registros.reduce((sum, r) => sum + r.totalSales, 0)
    const totalProfit = registros.reduce((sum, r) => sum + r.totalProfit, 0)
    const totalTransactions = registros.reduce((sum, r) => sum + r.totalTransactions, 0)
    const cashSales = registros.reduce((sum, r) => sum + r.cashSales, 0)
    const cardSales = registros.reduce((sum, r) => sum + r.cardSales, 0)
    const pixSales = registros.reduce((sum, r) => sum + r.pixSales, 0)
    const totalCost = totalSales - totalProfit
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

    const totals = {
      totalSales,
      totalProfit,
      totalTransactions,
      cashSales,
      cardSales,
      pixSales,
      totalCost,
      averageTicket,
      profitMargin,
    }

    const viewRegistros = registros.map((r) => {
      const regSales = r.totalSales || 0
      const regProfit = r.totalProfit || 0
      const regMargin = regSales > 0 ? (regProfit / regSales) * 100 : 0
      return {
        ...r.serialize(),
        regSales,
        regProfit,
        regMargin,
      }
    })

    return view.render('caixa/movement', {
      registros: viewRegistros,
      totals,
      filters: { dateFrom, dateTo },
    })
  }

  /**
   * Imprimir relatório de caixa
   */
  async print({ view, params, response, auth }: HttpContext) {
    const user = await auth.authenticate()

    const registro = await CaixaRegistro.query()
      .where('id', params.id)
      .where('empresa_id', user.empresaId)
      .preload('user')
      .first()

    if (!registro) {
      return response.notFound('Registro de caixa não encontrado')
    }

    // Estatísticas detalhadas por método de pagamento
    const paymentStatsResult = await Venda.query()
      .where('empresa_id', user.empresaId)
      .whereRaw('DATE(sale_date) = ?', [registro.registerDate.toISODate() ?? ''])
      .select('payment_method')
      .sum('total as total')
      .sum('profit as profit')
      .count('* as transactions')
      .groupBy('payment_method')
      .orderBy('payment_method')

    const paymentStats = paymentStatsResult.map((p) => {
      const total = extractSum([p], 'total')
      const statProfit = extractSum([p], 'profit')
      const trans = extractCount([p])
      const avg = trans > 0 ? total / trans : 0
      return {
        paymentMethod: (p as any).paymentMethod ?? (p as any).$extras?.payment_method ?? 'unknown',
        total,
        statProfit,
        trans,
        avg,
      }
    })

    const totalSales = registro.totalSales || 0
    const profit = registro.totalProfit || 0
    const transactions = registro.totalTransactions || 0
    const averageTicket = transactions > 0 ? totalSales / transactions : 0
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0

    const empresaModule = await import('#models/empresa')
    const empresa = await empresaModule.default.findOrFail(user.empresaId)

    return view.render('caixa/print', {
      registro: registro.serialize(),
      empresa: empresa.serialize(),
      paymentStats,
      totalSales,
      profit,
      transactions,
      averageTicket,
      margin,
    })
  }

  /**
   * API: Estatísticas do caixa
   */
  async stats({ response, auth }: HttpContext) {
    const user = await auth.authenticate()
    const openRegister = await CaixaRegistro.query()
      .where('empresa_id', user.empresaId)
      .where('status', 'open')
      .orderBy('register_date', 'desc')
      .first()

    if (!openRegister) {
      return response.json({
        isOpen: false,
        totalSales: 0,
        totalTransactions: 0,
        expectedCash: 0,
      })
    }

    return response.json({
      isOpen: openRegister.status === 'open',
      totalSales: openRegister.totalSales,
      totalTransactions: openRegister.totalTransactions,
      expectedCash: openRegister.expectedCashBalance,
      profitMargin: openRegister.profitMargin,
    })
  }

  /**
   * API: Dados do caixa atual para atualização automática
   */
  async currentData({ response, auth }: HttpContext) {
    const user = await auth.authenticate()
    const currentRegister = await CaixaRegistro.query()
      .where('empresa_id', user.empresaId)
      .where('status', 'open')
      .orderBy('register_date', 'desc')
      .first()

    if (!currentRegister) {
      return response.json({
        hasRegister: false,
      })
    }

    // Buscar vendas do dia
    const registerDate = currentRegister.registerDate.toISODate()
    const todaySales = await Venda.query()
      .where('empresa_id', user.empresaId)
      .whereRaw('DATE(sale_date) = ?', registerDate ? [registerDate] : [])
      .preload('comanda', (query) => query.preload('mesa'))
      .orderBy('sale_date', 'desc')

    // Calcular valores em tempo real das vendas
    const cashSales = todaySales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + Number(s.total), 0)

    const cardSales = todaySales
      .filter((s) => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + Number(s.total), 0)

    const pixSales = todaySales
      .filter((s) => s.paymentMethod === 'pix')
      .reduce((sum, s) => sum + Number(s.total), 0)

    const sales = cashSales + cardSales + pixSales
    const profit = todaySales.reduce((sum, s) => sum + Number(s.profit), 0)
    const cost = todaySales.reduce((sum, s) => sum + Number(s.costTotal), 0)
    const transactions = todaySales.length
    const margin = sales > 0 ? (profit / sales) * 100 : 0
    const averageTicket = transactions > 0 ? sales / transactions : 0
    const expected = Number.parseFloat(String(currentRegister.openingBalance || 0)) + cashSales

    return response.json({
      hasRegister: true,
      register: {
        id: currentRegister.id,
        openingBalance: currentRegister.openingBalance,
        cashSales: cashSales,
        cardSales: cardSales,
        pixSales: pixSales,
        openedAt: currentRegister.openedAt,
      },
      stats: {
        sales,
        profit,
        transactions,
        cost,
        margin,
        averageTicket,
        expected,
      },
      sales: todaySales.map((sale) => ({
        id: sale.id,
        saleDate: sale.saleDate,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        tableNumber: sale.comanda?.mesa?.number || null,
      })),
    })
  }
}
