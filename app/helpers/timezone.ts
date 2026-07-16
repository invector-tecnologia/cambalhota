import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

const DEFAULT_TZ = 'America/Sao_Paulo'

const BRAZIL_STATE_TZ_MAP: Record<string, string> = {
  AC: 'America/Rio_Branco',
  AL: 'America/Maceio',
  AM: 'America/Manaus',
  AP: 'America/Belem',
  BA: 'America/Bahia',
  CE: 'America/Fortaleza',
  DF: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo',
  GO: 'America/Sao_Paulo',
  MA: 'America/Fortaleza',
  MG: 'America/Sao_Paulo',
  MS: 'America/Campo_Grande',
  MT: 'America/Cuiaba',
  PA: 'America/Belem',
  PB: 'America/Fortaleza',
  PE: 'America/Recife',
  PI: 'America/Fortaleza',
  PR: 'America/Sao_Paulo',
  RJ: 'America/Sao_Paulo',
  RN: 'America/Fortaleza',
  RO: 'America/Porto_Velho',
  RR: 'America/Boa_Vista',
  RS: 'America/Sao_Paulo',
  SC: 'America/Sao_Paulo',
  SE: 'America/Maceio',
  SP: 'America/Sao_Paulo',
  TO: 'America/Araguaina',
}

export function resolveBrazilTimezone(state?: string | null): string {
  if (!state) return DEFAULT_TZ
  const uf = state.trim().toUpperCase()
  return BRAZIL_STATE_TZ_MAP[uf] || DEFAULT_TZ
}

export function resolveUserTimezone(
  ctx?: Pick<HttpContext, 'request'>,
  fallbackState?: string | null
): string {
  const headerTz = ctx?.request.header('x-timezone')
  const cookieTz = ctx?.request.cookie('tz')
  const candidate = (headerTz || cookieTz || '').trim()

  if (candidate) {
    const test = DateTime.now().setZone(candidate)
    if (test.isValid) {
      return candidate
    }
  }

  return resolveBrazilTimezone(fallbackState)
}
