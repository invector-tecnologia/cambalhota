/**
 * Serviço de Roteamento de Endpoints SEFAZ por UF
 *
 * Responsável por mapear cada UF brasileira ao autorizador correto
 * e fornecer os endpoints de webservices SEFAZ apropriados.
 *
 * Base: Manual de Orientação do Contribuinte MOC v12.0
 * Modelo: 65 (NFC-e)
 */

export interface SefazEndpoints {
  autorizacao: string
  retAutorizacao: string
  consultaProtocolo: string
  statusServico: string
  recepcaoEvento: string
  inutilizacao: string
}

export type Autorizador =
  | 'SEFAZ_PROPRIA' // Sefaz própria da UF
  | 'SVRS' // Sefaz Virtual RS (maioria usa)
  | 'SVAN' // Sefaz Virtual Ambiente Nacional
  | 'SVCAN' // SVC Contingência AN
  | 'SVCRS' // SVC Contingência RS

/**
 * Mapeamento de UF para Autorizador
 * Atualizado em: Janeiro/2026
 */
const UF_AUTORIZADOR_MAP: Record<string, Autorizador> = {
  // SVRS - Sefaz Virtual RS (maioria dos estados)
  AC: 'SVRS',
  AL: 'SVRS',
  AP: 'SVRS',
  DF: 'SVRS',
  ES: 'SVRS',
  PB: 'SVRS',
  RJ: 'SVRS',
  RN: 'SVRS',
  RO: 'SVRS',
  RR: 'SVRS',
  SC: 'SVRS',
  SE: 'SVRS',
  TO: 'SVRS',

  // SVAN - Sefaz Virtual Ambiente Nacional
  MA: 'SVAN',

  // SEFAZ PRÓPRIA - Estados com infraestrutura própria
  AM: 'SEFAZ_PROPRIA',
  BA: 'SEFAZ_PROPRIA',
  CE: 'SEFAZ_PROPRIA',
  GO: 'SEFAZ_PROPRIA',
  MG: 'SEFAZ_PROPRIA',
  MS: 'SEFAZ_PROPRIA',
  MT: 'SEFAZ_PROPRIA',
  PA: 'SEFAZ_PROPRIA',
  PE: 'SEFAZ_PROPRIA',
  PI: 'SEFAZ_PROPRIA',
  PR: 'SEFAZ_PROPRIA',
  RS: 'SEFAZ_PROPRIA',
  SP: 'SEFAZ_PROPRIA',
}

/**
 * Endpoints SVRS - Homologação
 */
const SVRS_HOMOLOGACAO: SefazEndpoints = {
  autorizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  retAutorizacao:
    'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
  consultaProtocolo: 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
  statusServico:
    'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx',
  recepcaoEvento:
    'https://nfce-homologacao.svrs.rs.gov.br/ws/recepcaoevento/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://nfce-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/NFeInutilizacao4.asmx',
}

/**
 * Endpoints SVRS - Produção
 */
const SVRS_PRODUCAO: SefazEndpoints = {
  autorizacao: 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  retAutorizacao: 'https://nfce.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
  consultaProtocolo: 'https://nfce.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
  statusServico: 'https://nfce.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx',
  recepcaoEvento: 'https://nfce.svrs.rs.gov.br/ws/recepcaoevento/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://nfce.svrs.rs.gov.br/ws/nfeinutilizacao/NFeInutilizacao4.asmx',
}

/**
 * Endpoints SVAN - Homologação
 */
const SVAN_HOMOLOGACAO: SefazEndpoints = {
  autorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  retAutorizacao:
    'https://hom.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
  consultaProtocolo:
    'https://hom.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
  statusServico: 'https://hom.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
  recepcaoEvento:
    'https://hom.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
}

/**
 * Endpoints SVAN - Produção
 */
const SVAN_PRODUCAO: SefazEndpoints = {
  autorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  retAutorizacao:
    'https://www.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
  consultaProtocolo:
    'https://www.sefazvirtual.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
  statusServico: 'https://www.sefazvirtual.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
  recepcaoEvento:
    'https://www.sefazvirtual.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
}

/**
 * Endpoints de Contingência SVCAN - Homologação
 */
const SVCAN_HOMOLOGACAO: SefazEndpoints = {
  autorizacao: 'https://hom.svc.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  retAutorizacao: 'https://hom.svc.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
  consultaProtocolo:
    'https://hom.svc.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
  statusServico: 'https://hom.svc.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
  recepcaoEvento: 'https://hom.svc.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://hom.svc.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
}

/**
 * Endpoints de Contingência SVCAN - Produção
 */
const SVCAN_PRODUCAO: SefazEndpoints = {
  autorizacao: 'https://www.svc.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  retAutorizacao: 'https://www.svc.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
  consultaProtocolo:
    'https://www.svc.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
  statusServico: 'https://www.svc.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
  recepcaoEvento: 'https://www.svc.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  inutilizacao: 'https://www.svc.fazenda.gov.br/NFeInutilizacao4/NFeInutilizacao4.asmx',
}

/**
 * Endpoints das SEFAZ Próprias - Homologação
 */
const SEFAZ_PROPRIA_HOMOLOGACAO: Record<string, SefazEndpoints> = {
  SP: {
    autorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
    retAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
    consultaProtocolo: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx',
    statusServico: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx',
    recepcaoEvento: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRecepcaoEvento4.asmx',
    inutilizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeInutilizacao4.asmx',
  },
  MG: {
    autorizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
  },
  RS: {
    autorizacao:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
    retAutorizacao:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
    consultaProtocolo:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
    statusServico:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx',
    recepcaoEvento:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/recepcaoevento/NFeRecepcaoEvento4.asmx',
    inutilizacao:
      'https://nfce-homologacao.sefazrs.rs.gov.br/ws/nfeinutilizacao/NFeInutilizacao4.asmx',
  },
  PR: {
    autorizacao: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeAutorizacao4',
    retAutorizacao: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeRetAutorizacao4',
    consultaProtocolo: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeConsultaProtocolo4',
    statusServico: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeStatusServico4',
    recepcaoEvento: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeRecepcaoEvento4',
    inutilizacao: 'https://homologacao.nfce.fazenda.pr.gov.br/nfce/NFeInutilizacao4',
  },
  AM: {
    autorizacao: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeAutorizacao4',
    retAutorizacao: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeRetAutorizacao4',
    consultaProtocolo:
      'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeConsultaProtocolo4',
    statusServico: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeStatusServico4',
    recepcaoEvento: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://homnfce.sefaz.am.gov.br/nfce-services/services/NFeInutilizacao4',
  },
  BA: {
    autorizacao: 'https://hnfce.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    retAutorizacao:
      'https://hnfce.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
    consultaProtocolo:
      'https://hnfce.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
    statusServico:
      'https://hnfce.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
    recepcaoEvento:
      'https://hnfce.sefaz.ba.gov.br/webservices/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    inutilizacao:
      'https://hnfce.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
  },
  CE: {
    autorizacao: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfceh.sefaz.ce.gov.br/nfce/services/NFeInutilizacao4',
  },
  GO: {
    autorizacao: 'https://homolog.nfce.go.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://homolog.nfce.go.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://homolog.nfce.go.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://homolog.nfce.go.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://homolog.nfce.go.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://homolog.nfce.go.gov.br/nfce/services/NFeInutilizacao4',
  },
  MS: {
    autorizacao: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeAutorizacao4',
    retAutorizacao: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeRetAutorizacao4',
    consultaProtocolo: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
    statusServico: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeStatusServico4',
    recepcaoEvento: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4',
    inutilizacao: 'https://hom.nfce.sefaz.ms.gov.br/ws/NFeInutilizacao4',
  },
  MT: {
    autorizacao: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeAutorizacao4',
    retAutorizacao: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeConsultaProtocolo4',
    statusServico: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeStatusServico4',
    recepcaoEvento: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://homologacao.sefaz.mt.gov.br/nfcews/services/NFeInutilizacao4',
  },
  PA: {
    autorizacao: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://homologacao.sefaz.pa.gov.br/nfce/services/NFeInutilizacao4',
  },
  PE: {
    autorizacao: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeRetAutorizacao4',
    consultaProtocolo:
      'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfcehomolog.sefaz.pe.gov.br/nfce-service/services/NFeInutilizacao4',
  },
  PI: {
    autorizacao: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://homologacao.sefaz.pi.gov.br/nfce/services/NFeInutilizacao4',
  },
}

/**
 * Endpoints das SEFAZ Próprias - Produção
 */
const SEFAZ_PROPRIA_PRODUCAO: Record<string, SefazEndpoints> = {
  SP: {
    autorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
    retAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
    consultaProtocolo: 'https://nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx',
    statusServico: 'https://nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx',
    recepcaoEvento: 'https://nfce.fazenda.sp.gov.br/ws/NFeRecepcaoEvento4.asmx',
    inutilizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeInutilizacao4.asmx',
  },
  MG: {
    autorizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
  },
  RS: {
    autorizacao: 'https://nfce.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
    retAutorizacao: 'https://nfce.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
    consultaProtocolo: 'https://nfce.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
    statusServico: 'https://nfce.sefazrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx',
    recepcaoEvento: 'https://nfce.sefazrs.rs.gov.br/ws/recepcaoevento/NFeRecepcaoEvento4.asmx',
    inutilizacao: 'https://nfce.sefazrs.rs.gov.br/ws/nfeinutilizacao/NFeInutilizacao4.asmx',
  },
  PR: {
    autorizacao: 'https://nfce.fazenda.pr.gov.br/nfce/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.fazenda.pr.gov.br/nfce/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.fazenda.pr.gov.br/nfce/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.fazenda.pr.gov.br/nfce/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.fazenda.pr.gov.br/nfce/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.fazenda.pr.gov.br/nfce/NFeInutilizacao4',
  },
  AM: {
    autorizacao: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.am.gov.br/nfce-services/services/NFeInutilizacao4',
  },
  BA: {
    autorizacao: 'https://nfce.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    retAutorizacao:
      'https://nfce.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
    consultaProtocolo:
      'https://nfce.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
    statusServico:
      'https://nfce.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
    recepcaoEvento:
      'https://nfce.sefaz.ba.gov.br/webservices/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    inutilizacao: 'https://nfce.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx',
  },
  CE: {
    autorizacao: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.ce.gov.br/nfce/services/NFeInutilizacao4',
  },
  GO: {
    autorizacao: 'https://nfce.go.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.go.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.go.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.go.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.go.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.go.gov.br/nfce/services/NFeInutilizacao4',
  },
  MS: {
    autorizacao: 'https://nfce.sefaz.ms.gov.br/ws/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.ms.gov.br/ws/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.ms.gov.br/ws/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.ms.gov.br/ws/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.ms.gov.br/ws/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.ms.gov.br/ws/NFeInutilizacao4',
  },
  MT: {
    autorizacao: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.mt.gov.br/nfcews/services/NFeInutilizacao4',
  },
  PA: {
    autorizacao: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.pa.gov.br/nfce/services/NFeInutilizacao4',
  },
  PE: {
    autorizacao: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.pe.gov.br/nfce-service/services/NFeInutilizacao4',
  },
  PI: {
    autorizacao: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeAutorizacao4',
    retAutorizacao: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeRetAutorizacao4',
    consultaProtocolo: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeConsultaProtocolo4',
    statusServico: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeStatusServico4',
    recepcaoEvento: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeRecepcaoEvento4',
    inutilizacao: 'https://nfce.sefaz.pi.gov.br/nfce/services/NFeInutilizacao4',
  },
}

/**
 * Serviço de Roteamento Fiscal
 */
export default class FiscalRoutingService {
  /**
   * Resolve endpoints SEFAZ corretos baseado em UF e ambiente
   *
   * @param uf - Sigla da UF (2 caracteres)
   * @param homologacao - true para ambiente de teste, false para produção
   * @returns Endpoints SEFAZ para a UF
   * @throws Error se UF não for suportada
   */
  static resolveEndpoints(uf: string, homologacao: boolean): SefazEndpoints {
    const ufUpper = uf.toUpperCase()
    const autorizador = UF_AUTORIZADOR_MAP[ufUpper]

    if (!autorizador) {
      throw new Error(`UF ${uf} não é suportada para emissão de NFC-e`)
    }

    // Resolve endpoints baseado no autorizador
    switch (autorizador) {
      case 'SVRS':
        return homologacao ? SVRS_HOMOLOGACAO : SVRS_PRODUCAO

      case 'SVAN':
        return homologacao ? SVAN_HOMOLOGACAO : SVAN_PRODUCAO

      case 'SVCAN':
        return homologacao ? SVCAN_HOMOLOGACAO : SVCAN_PRODUCAO

      case 'SVCRS':
        return homologacao ? SVRS_HOMOLOGACAO : SVRS_PRODUCAO

      case 'SEFAZ_PROPRIA': {
        const endpoints = homologacao
          ? SEFAZ_PROPRIA_HOMOLOGACAO[ufUpper]
          : SEFAZ_PROPRIA_PRODUCAO[ufUpper]

        if (!endpoints) {
          throw new Error(`Endpoints da SEFAZ própria não configurados para UF ${uf}`)
        }

        return endpoints
      }

      default:
        throw new Error(`Autorizador ${autorizador} não reconhecido`)
    }
  }

  /**
   * Verifica se a UF suporta emissão de NFC-e
   *
   * @param uf - Sigla da UF
   * @returns true se suportada, false caso contrário
   */
  static supportsNFCe(uf: string): boolean {
    const ufUpper = uf.toUpperCase()
    return ufUpper in UF_AUTORIZADOR_MAP
  }

  /**
   * Retorna o autorizador responsável pela UF
   *
   * @param uf - Sigla da UF
   * @returns Nome do autorizador
   * @throws Error se UF não for mapeada
   */
  static getAutorizador(uf: string): Autorizador {
    const ufUpper = uf.toUpperCase()
    const autorizador = UF_AUTORIZADOR_MAP[ufUpper]

    if (!autorizador) {
      throw new Error(`UF ${uf} não está mapeada no sistema`)
    }

    return autorizador
  }

  /**
   * Retorna lista de todas as UFs suportadas
   */
  static getSupportedUFs(): string[] {
    return Object.keys(UF_AUTORIZADOR_MAP).sort()
  }

  /**
   * Retorna endpoints de contingência (SVCAN)
   */
  static getContingencyEndpoints(homologacao: boolean): SefazEndpoints {
    return homologacao ? SVCAN_HOMOLOGACAO : SVCAN_PRODUCAO
  }

  /**
   * Valida formato de UF
   */
  static isValidUFFormat(uf: string): boolean {
    return /^[A-Z]{2}$/.test(uf.toUpperCase())
  }
}
