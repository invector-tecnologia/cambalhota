import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Pedido from '#models/pedido'
import Venda from '#models/venda'
import Funcionario from '#models/funcionario'
import Produto from '#models/cardapio_produto'
import Fornecedor from '#models/fornecedor'
import Insumo from '#models/insumo'
import db from '@adonisjs/lucid/services/db'

export default class ReportsController {
  /**
   * Página de relatórios BI multimodelo
   */
  async index({ auth, view, request, logger }: HttpContext) {
    const user = await auth.authenticate()

    // Parâmetros gerais
    const startDateParam = request.input('start_date') as string | undefined
    const endDateParam = request.input('end_date') as string | undefined
    const modelType = (request.input('model', 'sales') as string).toLowerCase()
    const perPageParam = Number(request.input('per_page', 20))
    const perPage = Math.min(Math.max(perPageParam, 5), 100)
    const page = Number(request.input('page', 1)) || 1

    const startDate = startDateParam
      ? DateTime.fromISO(startDateParam).startOf('day')
      : DateTime.now().minus({ days: 7 }).startOf('day')
    const endDate = endDateParam
      ? DateTime.fromISO(endDateParam).endOf('day')
      : DateTime.now().endOf('day')

    logger.info(
      `[REPORTS] Fetching ${modelType} data for empresa ${user.empresaId} from ${startDate.toISODate()} to ${endDate.toISODate()}`
    )

    // Dados base para todos os relatórios
    let kpis: any = {}
    let charts: any = { labels: [], data: [] }
    let rows: any[] = []
    let totalRecords = 0

    // Rotas para cada tipo de modelo
    if (modelType === 'sales') {
      const result = await this.getSalesReport(user.empresaId, startDate, endDate, page, perPage)
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    } else if (modelType === 'orders') {
      const result = await this.getOrdersReport(user.empresaId, startDate, endDate, page, perPage)
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    } else if (modelType === 'employees') {
      const result = await this.getEmployeesReport(
        user.empresaId,
        startDate,
        endDate,
        page,
        perPage
      )
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    } else if (modelType === 'products') {
      const result = await this.getProductsReport(user.empresaId, startDate, endDate, page, perPage)
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    } else if (modelType === 'suppliers') {
      const result = await this.getSuppliersReport(
        user.empresaId,
        startDate,
        endDate,
        page,
        perPage
      )
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    } else if (modelType === 'inventory') {
      const result = await this.getInventoryReport(
        user.empresaId,
        startDate,
        endDate,
        page,
        perPage
      )
      kpis = result.kpis
      charts = result.charts
      rows = result.rows
      totalRecords = result.total
    }

    const totalPages = Math.max(1, Math.ceil(totalRecords / perPage))
    const currentPage = Math.min(Math.max(page, 1), totalPages)

    const chartJson = JSON.stringify(charts)

    logger.info(`[REPORTS] Rendering ${modelType} report`)

    return view.render('reports/index', {
      modelType,
      kpis,
      charts: chartJson,
      rows,
      pagination: { total: totalRecords, totalPages, currentPage, perPage },
      filters: {
        startDate: startDate.toISODate(),
        endDate: endDate.toISODate(),
        model: modelType,
        perPage,
      },
    })
  }

  /**
   * Relatório de Vendas - Faturamento
   */
  private async getSalesReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const salesSum = await db
      .from('vendas')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(
        db.raw('COUNT(*) as count'),
        db.raw("SUM(CASE WHEN total IS NULL OR total::text = 'NaN' THEN 0 ELSE total END) as total")
      )

    const kpis = {
      count: Number(salesSum[0]?.count || 0),
      total: (() => {
        const val = salesSum[0]?.total || 0
        const num = Number(val)
        return Number.isNaN(num) ? 0 : num
      })(),
      average: (() => {
        const count = Number(salesSum[0]?.count || 0)
        if (count === 0) return 0
        const val = salesSum[0]?.total || 0
        const num = Number(val)
        const total = Number.isNaN(num) ? 0 : num
        return total / count
      })(),
    }

    const paymentMethodMap: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      split: 'Split',
    }

    // Gráfico 1: Vendas por método de pagamento
    const paymentRows = await db
      .from('vendas')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(
        'payment_method',
        db.raw('COUNT(*) as total'),
        db.raw(
          "SUM(CASE WHEN total IS NULL OR total::text = 'NaN' THEN 0 ELSE total END) as amount"
        )
      )
      .groupBy('payment_method')

    const paymentChart = {
      labels: paymentRows.map(
        (r: any) => paymentMethodMap[r.payment_method] || r.payment_method || 'Outro'
      ),
      data: paymentRows.map((r: any) => Number(r.amount || 0)),
    }

    // Gráfico 2: Faturamento por dia
    const dailyRows = await db
      .from('vendas')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(
        db.raw('DATE(created_at) as day'),
        db.raw(
          "SUM(CASE WHEN total IS NULL OR total::text = 'NaN' THEN 0 ELSE total END) as amount"
        )
      )
      .groupByRaw('DATE(created_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: dailyRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: dailyRows.map((r: any) => Number(r.amount || 0)),
    }

    const charts = [paymentChart, lineChart]

    // Tabela: Últimas vendas
    const sales = await Venda.query()
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(['id', 'sale_number', 'payment_method', 'total', 'created_at'])
      .orderBy('created_at', 'desc')

    const total = sales.length
    const start = (page - 1) * perPage
    const pagedSales = sales.slice(start, start + perPage)

    const rows = pagedSales.map((s) => ({
      id: s.id,
      number: s.saleNumber || `${s.id}`,
      paymentMethod: paymentMethodMap[s.paymentMethod] || s.paymentMethod,
      amount: Number(s.total || 0),
      date: s.createdAt,
    }))

    return { kpis, charts, rows, total }
  }

  /**
   * Relatório de Pedidos - Volume
   */
  private async getOrdersReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const ordersData = await db
      .from('pedidos')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(
        db.raw('COUNT(*) as count'),
        db.raw("COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count")
      )

    const kpis = {
      count: Number(ordersData[0]?.count || 0),
      paidCount: Number(ordersData[0]?.paid_count || 0),
      conversionRate: (() => {
        const count = Number(ordersData[0]?.count || 0)
        const paid = Number(ordersData[0]?.paid_count || 0)
        if (count === 0) return 0
        return ((paid / count) * 100).toFixed(1)
      })(),
    }

    // Gráficos: Pedidos por status
    const statusRows = await db
      .from('pedidos')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select('status', db.raw('COUNT(*) as total'))
      .groupBy('status')

    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      paid: 'Pago',
      cancelled: 'Cancelado',
      completed: 'Concluído',
    }

    // Gráfico 1: Pedidos por status
    const statusChart = {
      labels: statusRows.map((r: any) => statusMap[r.status] || r.status || 'Outro'),
      data: statusRows.map((r: any) => Number(r.total || 0)),
    }

    // Gráfico 2: Pedidos por dia
    const dailyRows = await db
      .from('pedidos')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as total'))
      .groupByRaw('DATE(created_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: dailyRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: dailyRows.map((r: any) => Number(r.total || 0)),
    }

    const charts = [statusChart, lineChart]

    // Tabela: Últimos pedidos
    const orders = await Pedido.query()
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(['id', 'order_number', 'status', 'type', 'created_at'])
      .orderBy('created_at', 'desc')

    const total = orders.length
    const start = (page - 1) * perPage
    const pagedOrders = orders.slice(start, start + perPage)

    const orderTypeMap: Record<string, string> = {
      dine_in: 'Presencial',
      takeaway: 'Retirada',
      delivery: 'Entrega',
    }

    const rows = pagedOrders.map((o) => ({
      id: o.id,
      number: o.orderNumber || `${o.id}`,
      status: statusMap[o.status] || o.status,
      type: orderTypeMap[o.type] || o.type,
      date: o.createdAt,
    }))

    return { kpis, charts, rows, total }
  }

  /**
   * Relatório de Funcionários - Desempenho
   */
  private async getEmployeesReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const employeesData = await db
      .from('funcionarios')
      .where('empresa_id', empresaId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN active = true THEN 1 END) as active')
      )

    const kpis = {
      total: Number(employeesData[0]?.total || 0),
      active: Number(employeesData[0]?.active || 0),
      inactive: (() => {
        const total = Number(employeesData[0]?.total || 0)
        const active = Number(employeesData[0]?.active || 0)
        return total - active
      })(),
    }

    // Gráfico 1: Status dos funcionários
    const statusRows = await db
      .from('funcionarios')
      .where('empresa_id', empresaId)
      .select('active', db.raw('COUNT(*) as total'))
      .groupBy('active')

    const statusChart = {
      labels: statusRows.map((r: any) => (r.active === true ? 'Ativo' : 'Inativo')),
      data: statusRows.map((r: any) => Number(r.total || 0)),
    }

    // Gráfico 2: Contratações por período
    const hireRows = await db
      .from('funcionarios')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as total'))
      .groupByRaw('DATE(created_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: hireRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: hireRows.map((r: any) => Number(r.total || 0)),
    }

    const charts = [statusChart, lineChart]

    // Tabela: Funcionários
    const employees = await Funcionario.query()
      .where('empresa_id', empresaId)
      .select(['id', 'name', 'active', 'email', 'createdAt'])
      .orderBy('createdAt', 'desc')

    const total = employees.length
    const start = (page - 1) * perPage
    const pagedEmployees = employees.slice(start, start + perPage)

    const rows = pagedEmployees.map((e: any) => ({
      id: e.id,
      name: e.name || 'S/N',
      status: e.active === true ? 'Ativo' : 'Inativo',
      email: e.email || '-',
      date: e.createdAt,
    }))

    return { kpis, charts, rows, total }
  }

  /**
   * Relatório de Produtos - Catálogo
   */
  private async getProductsReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const productsData = await db
      .from('cardapio_produtos')
      .where('empresa_id', empresaId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN active = true THEN 1 END) as active')
      )

    const kpis = {
      total: Number(productsData[0]?.total || 0),
      active: Number(productsData[0]?.active || 0),
      inactive: (() => {
        const total = Number(productsData[0]?.total || 0)
        const active = Number(productsData[0]?.active || 0)
        return total - active
      })(),
    }

    // Gráfico 1: Produtos por categoria
    const categoryRows = await db
      .from('cardapio_produtos')
      .join(
        'cardapio_categorias',
        'cardapio_produtos.cardapio_categoria_id',
        'cardapio_categorias.id'
      )
      .where('cardapio_produtos.empresa_id', empresaId)
      .select('cardapio_categorias.name', db.raw('COUNT(*) as total'))
      .groupBy('cardapio_categorias.name')

    const categoryChart = {
      labels: categoryRows.map((r: any) => r.name || 'Sem categoria'),
      data: categoryRows.map((r: any) => Number(r.total || 0)),
    }

    // Gráfico 2: Produtos adicionados no período
    const addedRows = await db
      .from('cardapio_produtos')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as total'))
      .groupByRaw('DATE(created_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: addedRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: addedRows.map((r: any) => Number(r.total || 0)),
    }

    const charts = [categoryChart, lineChart]

    // Tabela: Produtos
    const products = await Produto.query()
      .where('empresa_id', empresaId)
      .select(['id', 'name', 'active', 'salePrice', 'createdAt'])
      .orderBy('createdAt', 'desc')

    const total = products.length
    const start = (page - 1) * perPage
    const pagedProducts = products.slice(start, start + perPage)

    const rows = pagedProducts.map((p) => ({
      id: p.id,
      name: p.name || 'S/N',
      status: p.active ? 'Ativo' : 'Inativo',
      price: Number(p.salePrice || 0),
      date: p.createdAt,
    }))

    return { kpis, charts, rows, total }
  }

  /**
   * Relatório de Fornecedores - Parcerias
   */
  private async getSuppliersReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const suppliersData = await db
      .from('fornecedores')
      .where('empresa_id', empresaId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN active = true THEN 1 END) as active')
      )

    const kpis = {
      total: Number(suppliersData[0]?.total || 0),
      active: Number(suppliersData[0]?.active || 0),
      inactive: (() => {
        const total = Number(suppliersData[0]?.total || 0)
        const active = Number(suppliersData[0]?.active || 0)
        return total - active
      })(),
    }

    // Gráfico 1: Status dos fornecedores
    const statusRows = await db
      .from('fornecedores')
      .where('empresa_id', empresaId)
      .select('active', db.raw('COUNT(*) as total'))
      .groupBy('active')

    const statusChart = {
      labels: statusRows.map((r: any) => (r.active ? 'Ativo' : 'Inativo')),
      data: statusRows.map((r: any) => Number(r.total || 0)),
    }

    // Gráfico 2: Fornecedores cadastrados no período
    const addedRows = await db
      .from('fornecedores')
      .where('empresa_id', empresaId)
      .whereBetween('created_at', [startDate.toISO()!, endDate.toISO()!])
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as total'))
      .groupByRaw('DATE(created_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: addedRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: addedRows.map((r: any) => Number(r.total || 0)),
    }

    const charts = [statusChart, lineChart]

    // Tabela: Fornecedores
    const suppliers = await Fornecedor.query()
      .where('empresa_id', empresaId)
      .select(['id', 'name', 'active', 'email', 'created_at'])
      .orderBy('created_at', 'desc')

    const total = suppliers.length
    const start = (page - 1) * perPage
    const pagedSuppliers = suppliers.slice(start, start + perPage)

    const rows = pagedSuppliers.map((s) => ({
      id: s.id,
      name: s.name || 'S/N',
      status: s.active ? 'Ativo' : 'Inativo',
      email: s.email || '-',
      date: s.createdAt,
    }))

    return { kpis, charts, rows, total }
  }

  /**
   * Relatório de Estoque - Insumos
   */
  private async getInventoryReport(
    empresaId: number,
    startDate: DateTime,
    endDate: DateTime,
    page: number,
    perPage: number
  ) {
    // KPIs
    const inventoryData = await db
      .from('insumos')
      .where('empresa_id', empresaId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock')
      )

    const kpis = {
      total: Number(inventoryData[0]?.total || 0),
      lowStock: Number(inventoryData[0]?.low_stock || 0),
      sufficient: (() => {
        const total = Number(inventoryData[0]?.total || 0)
        const low = Number(inventoryData[0]?.low_stock || 0)
        return total - low
      })(),
    }

    // Gráfico 1: Status do estoque
    const stockRows = await db
      .from('insumos')
      .where('empresa_id', empresaId)
      .select(
        db.raw("CASE WHEN current_stock <= minimum_stock THEN 'Baixo' ELSE 'Normal' END as status"),
        db.raw('COUNT(*) as total')
      )
      .groupByRaw("CASE WHEN current_stock <= minimum_stock THEN 'Baixo' ELSE 'Normal' END")

    const stockChart = {
      labels: stockRows.map((r: any) => r.status || 'Desconhecido'),
      data: stockRows.map((r: any) => Number(r.total || 0)),
    }

    // Gráfico 2: Movimento de estoque no período
    const movementRows = await db
      .from('insumos')
      .where('empresa_id', empresaId)
      .whereBetween('updated_at', [startDate.toISO()!, endDate.toISO()!])
      .select(db.raw('DATE(updated_at) as day'), db.raw('COUNT(*) as total'))
      .groupByRaw('DATE(updated_at)')
      .orderBy('day', 'asc')

    const lineChart = {
      labels: movementRows.map((r: any) => {
        const date = DateTime.fromISO(r.day).toFormat('dd/LL')
        return date
      }),
      data: movementRows.map((r: any) => Number(r.total || 0)),
    }

    const charts = [stockChart, lineChart]

    // Tabela: Insumos
    const insumos = await Insumo.query()
      .where('empresa_id', empresaId)
      .select(['id', 'name', 'currentStock', 'minimumStock', 'updatedAt'])
      .orderBy('updatedAt', 'desc')

    const total = insumos.length
    const start = (page - 1) * perPage
    const pagedInsumos = insumos.slice(start, start + perPage)

    const rows = pagedInsumos.map((i) => ({
      id: i.id,
      name: i.name || 'S/N',
      current: Number(i.currentStock || 0),
      minimum: Number(i.minimumStock || 0),
      date: i.updatedAt,
    }))

    return { kpis, charts, rows, total }
  }
}
