import type { SefazResponse } from './types.js'

/**
 * Parser de respostas SOAP retornadas pela SEFAZ
 *
 * Extrai campos relevantes (cStat, xMotivo, chNFe, nProt) de respostas
 * tanto de autorização quanto de consulta e eventos.
 */
export default class SefazResponseParser {
  /**
   * Faz parse completo da resposta SOAP da SEFAZ.
   * Tenta extrair dados tanto do <protNFe> quanto do <retEnviNFe>.
   */
  static parse(responseData: string): SefazResponse {
    if (!responseData || typeof responseData !== 'string') {
      return { error: 'Resposta vazia ou inválida da SEFAZ' }
    }

    // Extrai todos os campos relevantes — pega a ÚLTIMA ocorrência de cStat/xMotivo
    // porque a primeira pode ser do <retEnviNFe> (lote) e a segunda do <protNFe> (nota)
    const allStatuses = [...responseData.matchAll(/<cStat>(\d+)<\/cStat>/g)]
    const allMessages = [...responseData.matchAll(/<xMotivo>([^<]+)<\/xMotivo>/g)]
    const accessKeyMatch = responseData.match(/<chNFe>(\d{44})<\/chNFe>/)
    const protocolMatch = responseData.match(/<nProt>(\d+)<\/nProt>/)

    // Status e mensagem do protocolo da nota (último match) ou do lote (primeiro)
    const protStatus = allStatuses.length > 1 ? allStatuses[allStatuses.length - 1] : allStatuses[0]
    const protMessage =
      allMessages.length > 1 ? allMessages[allMessages.length - 1] : allMessages[0]

    const status = protStatus ? Number.parseInt(protStatus[1], 10) : undefined
    const message = protMessage?.[1]

    // Se temos status e é código de sucesso (100 = autorizado, 150 = autorizado fora prazo)
    if (status === 100 || status === 150) {
      return {
        accessKey: accessKeyMatch?.[1],
        protocolNumber: protocolMatch?.[1],
        status,
        message,
      }
    }

    // Se temos status mas não é sucesso, é um erro semântico da SEFAZ
    if (status !== undefined) {
      return {
        accessKey: accessKeyMatch?.[1],
        protocolNumber: protocolMatch?.[1],
        status,
        message,
        error: `SEFAZ cStat=${status}: ${message || 'Sem mensagem'}`,
      }
    }

    // Se não conseguimos extrair nenhum cStat, pode ser um Fault SOAP
    const faultString =
      responseData.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1] ||
      responseData.match(/<Reason><Text[^>]*>([^<]+)<\/Text>/)?.[1]

    if (faultString) {
      return { error: `SOAP Fault: ${faultString}`, rawResponse: responseData.slice(0, 2000) }
    }

    return {
      error: 'Não foi possível interpretar a resposta da SEFAZ',
      rawResponse: responseData.slice(0, 2000),
    }
  }
}
