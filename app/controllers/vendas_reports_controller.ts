import type { HttpContext } from '@adonisjs/core/http'
import Venda from '#models/venda'
import VendaItem from '#models/venda_item'
import { DateTime } from 'luxon'
import { resolveUserTimezone } from '#helpers/timezone'
import { extractCount, extractSum } from '#helpers/db_agg'
import db from '@adonisjs/lucid/services/db'

export default class VendasReportsController {
  /**
   * Dashboard financeiro
   */
  async dashboard({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const period = request.input('period', 'today')

    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    let startDate: DateTime
    let endDate: DateTime = DateTime.now().setZone(timezone)

    switch (period) {
      case 'today':
        startDate = DateTime.now().setZone(timezone).startOf('day')
        break
      case 'week':
        startDate = DateTime.now().setZone(timezone).startOf('week')
        break
      case 'month':
        startDate = DateTime.now().setZone(timezone).startOf('month')
        break
      case 'year':
        startDate = DateTime.now().setZone(timezone).startOf('year')
        break
      default:
        startDate = DateTime.now().setZone(timezone).startOf('day')
    }

    const [vendas, totalSales, totalProfit] = await Promise.all([
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', startDate.toSQLDate()!)
        .where('sale_date', '<=', endDate.toSQLDate()!)
        .sum('total as total'),
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', startDate.toSQLDate()!)
        .where('sale_date', '<=', endDate.toSQLDate()!)
        .count('* as count'),
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', startDate.toSQLDate()!)
        .where('sale_date', '<=', endDate.toSQLDate()!)
        .sum('profit as profit'),
    ])

    const paymentMethodSales = await Venda.query()
      .where('empresa_id', user.empresaId)
      .where('sale_date', '>=', startDate.toSQLDate()!)
      .where('sale_date', '<=', endDate.toSQLDate()!)
      .select('payment_method')
      .sum('total as total')
      .count('* as count')
      .groupBy('payment_method')

    const topItems = await VendaItem.query()
      .whereHas('venda', (saleQuery) => {
        saleQuery
          .where('empresa_id', user.empresaId)
          .where('sale_date', '>=', startDate.toSQLDate()!)
          .where('sale_date', '<=', endDate.toSQLDate()!)
      })
      .preload('cardapioProduto')
      .select('cardapio_produto_id', 'item_name')
      .sum('quantity as total_quantity')
      .sum('subtotal as total_revenue')
      .sum('profit as total_profit')
      .groupBy('cardapio_produto_id', 'item_name')
      .orderBy('total_quantity', 'desc')
      .limit(10)

    const totalSalesAmount = extractSum(vendas, 'total')
    const totalTransactionsCount = extractCount(totalSales)
    const totalProfitAmount = extractSum(totalProfit, 'profit')

    return view.render('vendas/dashboard', {
      stats: {
        totalSales: totalSalesAmount,
        totalTransactions: totalTransactionsCount,
        totalProfit: totalProfitAmount,
        averageTicket: totalTransactionsCount > 0 ? totalSalesAmount / totalTransactionsCount : 0,
      },
      paymentMethodSales: paymentMethodSales.map((p) => p.serialize()),
      topItems: topItems.map((i) => i.serialize()),
      period,
    })
  }

  /**
   * Relatorio de vendas
   */
  async reports({ view, request, auth }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const dateFrom = request.input(
      'date_from',
      DateTime.now().setZone(timezone).startOf('month').toISODate()
    )
    const dateTo = request.input('date_to', DateTime.now().setZone(timezone).toISODate())
    const groupBy = request.input('group_by', 'day')

    let salesData: any[] = []

    if (groupBy === 'day') {
      salesData = await Venda.query()
        .where('empresa_id', user.empresaId)
        .whereBetween('sale_date', [dateFrom!, dateTo!])
        .select(db.raw('DATE(sale_date) as date'))
        .sum('total as total_sales')
        .sum('profit as total_profit')
        .sum('cost_total as total_cost')
        .count('* as total_transactions')
        .groupByRaw('DATE(sale_date)')
        .orderByRaw('DATE(sale_date) ASC')
    } else if (groupBy === 'week') {
      salesData = await Venda.query()
        .where('empresa_id', user.empresaId)
        .whereBetween('sale_date', [dateFrom!, dateTo!])
        .select(db.raw('TO_CHAR(sale_date, \'YYYY-"W"IW\') as date'))
        .sum('total as total_sales')
        .sum('profit as total_profit')
        .sum('cost_total as total_cost')
        .count('* as total_transactions')
        .groupByRaw('TO_CHAR(sale_date, \'YYYY-"W"IW\')')
        .orderByRaw('TO_CHAR(sale_date, \'YYYY-"W"IW\') ASC')
    } else if (groupBy === 'month') {
      salesData = await Venda.query()
        .where('empresa_id', user.empresaId)
        .whereBetween('sale_date', [dateFrom!, dateTo!])
        .select(db.raw("TO_CHAR(sale_date, 'YYYY-MM') as date"))
        .sum('total as total_sales')
        .sum('profit as total_profit')
        .sum('cost_total as total_cost')
        .count('* as total_transactions')
        .groupByRaw("TO_CHAR(sale_date, 'YYYY-MM')")
        .orderByRaw("TO_CHAR(sale_date, 'YYYY-MM') ASC")
    }

    const formattedData = salesData.map((row: any) => {
      let formattedDate = row.date || row.$extras?.date

      if (groupBy === 'week') {
        const match = formattedDate?.match(/(\d{4})-W(\d{2})/)
        if (match) {
          formattedDate = `Semana ${match[2]}/${match[1]}`
        }
      } else if (groupBy === 'month') {
        const match = formattedDate?.match(/(\d{4})-(\d{2})/)
        if (match) {
          const months = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez',
          ]
          formattedDate = `${months[Number.parseInt(match[2]) - 1]}/${match[1]}`
        }
      } else {
        const match = formattedDate?.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
          formattedDate = `${match[3]}/${match[2]}/${match[1]}`
        }
      }

      return {
        ...row,
        $extras: {
          date: formattedDate,
          total_sales: row.$extras?.sum || row.$extras?.total_sales || 0,
          total_profit: row.$extras?.['sum:1'] || row.$extras?.total_profit || 0,
          total_cost: row.$extras?.['sum:2'] || row.$extras?.total_cost || 0,
          total_transactions: row.$extras?.count || row.$extras?.total_transactions || 0,
        },
      }
    })

    return view.render('vendas/reports', {
      salesData: formattedData,
      filters: { dateFrom, dateTo, groupBy },
    })
  }

  /**
   * API: Estatisticas rapidas
   */
  async stats({ response, auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const timezone = resolveUserTimezone({ request }, user.empresa?.state)
    const today = DateTime.now().setZone(timezone).startOf('day')

    const [todaySales, todayTransactions, monthSales, yearSales] = await Promise.all([
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', today.toSQLDate()!)
        .sum('total as total'),
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', today.toSQLDate()!)
        .count('* as count'),
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', DateTime.now().setZone(timezone).startOf('month').toSQLDate()!)
        .sum('total as total'),
      Venda.query()
        .where('empresa_id', user.empresaId)
        .where('sale_date', '>=', DateTime.now().setZone(timezone).startOf('year').toSQLDate()!)
        .sum('total as total'),
    ])

    return response.json({
      todaySales: extractSum(todaySales, 'total'),
      todayTransactions: extractCount(todayTransactions),
      monthSales: extractSum(monthSales, 'total'),
      yearSales: extractSum(yearSales, 'total'),
    })
  }
}
