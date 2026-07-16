import type { HttpContext } from '@adonisjs/core/http'
import FiscalNote from '#models/fiscal_note'
import { extractCount } from '#helpers/db_agg'

export default class FiscalPagesController {
  /**
   * Página: /fiscal
   * Lista notas fiscais emitidas com filtros e ações
   */
  async index({ auth, request, view, response }: HttpContext) {
    const user = await auth.authenticate()
    const establishmentId = (user as any).establishment_id || (user as any).empresaId

    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 20))
    const status = request.input('status') as string | undefined
    const startDate = request.input('start_date') as string | undefined
    const endDate = request.input('end_date') as string | undefined

    let query = FiscalNote.query()
      .whereHas('fiscalConfig', (configQuery) => {
        configQuery.where('establishment_id', establishmentId)
      })
      .preload('venda')

    if (status) {
      query = query.where('status', status)
    }

    if (startDate) {
      query = query.whereRaw('DATE(fiscal_notes.created_at) >= ?', [startDate])
    }
    if (endDate) {
      query = query.whereRaw('DATE(fiscal_notes.created_at) <= ?', [endDate])
    }

    const notes = await query.orderBy('created_at', 'desc').paginate(page, limit)

    // Contadores por status para visão geral
    const [totalAll, totalAuth, totalPend, totalCanc, totalCont, totalErr] = await Promise.all([
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .count('* as total'),
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .where('status', 'AUTHORIZED')
        .count('* as total'),
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .where('status', 'PENDING')
        .count('* as total'),
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .where('status', 'CANCELLED')
        .count('* as total'),
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .where('status', 'CONTINGENCY')
        .count('* as total'),
      FiscalNote.query()
        .whereHas('fiscalConfig', (q) => q.where('establishment_id', establishmentId))
        .where('status', 'ERROR')
        .count('* as total'),
    ])

    const counters = {
      all: extractCount(totalAll),
      authorized: extractCount(totalAuth),
      pending: extractCount(totalPend),
      cancelled: extractCount(totalCanc),
      contingency: extractCount(totalCont),
      error: extractCount(totalErr),
    }

    const html = await view.render('fiscal/index', {
      paginator: notes.toJSON(),
      filters: { page, limit, status, startDate, endDate },
      counters,
    })
    return response.type('text/html').send(html)
  }
}
