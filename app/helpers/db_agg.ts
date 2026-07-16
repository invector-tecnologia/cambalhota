export function extractAgg(rows: any[] | undefined, keys: string[] | string, fallback = 0): number {
  try {
    if (!rows || rows.length === 0) return fallback
    const extras = rows[0]?.$extras || rows[0]
    const keyList = Array.isArray(keys) ? keys : [keys]
    for (const k of keyList) {
      const v = extras?.[k as any]
      if (v !== undefined && v !== null) {
        const n = Number(v)
        return Number.isFinite(n) ? n : fallback
      }
    }
    // tentativa com chaves comuns
    const common = ['total', 'count', 'count(*)', 'sum']
    for (const k of common) {
      const v = extras?.[k as any]
      if (v !== undefined && v !== null) {
        const n = Number(v)
        return Number.isFinite(n) ? n : fallback
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

export function extractCount(rows: any[] | undefined, fallback = 0): number {
  return extractAgg(rows, ['total', 'count', 'count(*)'], fallback)
}

export function extractSum(rows: any[] | undefined, keys: string[] | string, fallback = 0): number {
  return extractAgg(rows, keys, fallback)
}
