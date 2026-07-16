/**
 * Exemplos de uso do FiscalXMLValidator
 * Demonstra como validar XML antes e depois da assinatura
 */

import FiscalXMLValidator from '#services/fiscal_xml_validator'
import FiscalSigner from '#services/fiscal_signer'

// ============================================================
// EXEMPLO 1: Validar XML não-assinado
// ============================================================

export async function exampleValidateUnsignedXML(xmlContent: string) {
  const validator = new FiscalXMLValidator()

  // Valida XML gerado (antes da assinatura)
  const validation = validator.validateUnsignedXML(xmlContent)

  // Gera relatório legível
  const report = FiscalXMLValidator.generateReport(validation)
  console.log(report)

  if (!validation.isValid) {
    console.error('❌ XML contém erros. Corrija antes de assinar:')
    validation.errors.forEach((err) => {
      console.error(`  [${err.code}] ${err.message}`)
    })
    return null
  }

  console.log('✅ XML válido e pronto para assinatura')
  return validation
}

// ============================================================
// EXEMPLO 2: Validar XML assinado
// ============================================================

export async function exampleValidateSignedXML(signedXmlContent: string) {
  const validator = new FiscalXMLValidator()

  // Valida XML assinado (após assinatura digital)
  const validation = validator.validateSignedXML(signedXmlContent)

  // Gera relatório legível
  const report = FiscalXMLValidator.generateReport(validation)
  console.log(report)

  if (!validation.isValid) {
    console.error('❌ XML assinado contém erros. Não pode ser transmitido:')
    validation.errors.forEach((err) => {
      console.error(`  [${err.code}] ${err.message}`)
    })
    return null
  }

  console.log('✅ XML assinado válido e pronto para transmissão ao SEFAZ')
  return validation
}

// ============================================================
// EXEMPLO 3: Fluxo completo com validação integrada
// ============================================================

export async function exampleCompleteFlowWithValidation(
  xmlContent: string,
  certificatePath: string,
  certificatePassword: string
) {
  console.log('🚀 INICIANDO FLUXO DE EMISSÃO COM VALIDAÇÃO\n')

  const validator = new FiscalXMLValidator()

  // PASSO 1: Validar XML gerado
  console.log('📋 PASSO 1: Validando XML gerado...\n')
  const preValidation = validator.validateUnsignedXML(xmlContent)
  let report = FiscalXMLValidator.generateReport(preValidation)
  console.log(report)

  if (!preValidation.isValid) {
    console.error('\n❌ FALHA: XML não passou na validação pré-assinatura')
    return null
  }

  // PASSO 2: Assinar XML (com validação automática integrada)
  console.log('\n📋 PASSO 2: Assinando XML com certificado A1...\n')
  let signedXml: string
  try {
    // O FiscalSigner agora valida automaticamente antes e depois da assinatura
    signedXml = await FiscalSigner.signXml(
      xmlContent,
      certificatePath,
      certificatePassword,
      true // validateBeforeSigning (já faz pré-validação)
    )
    console.log('✅ XML assinado com sucesso\n')
  } catch (error) {
    console.error(`❌ FALHA na assinatura: ${(error as Error).message}`)
    return null
  }

  // PASSO 3: Validar XML assinado (dupla checagem)
  console.log('📋 PASSO 3: Validando XML assinado...\n')
  const postValidation = validator.validateSignedXML(signedXml)
  report = FiscalXMLValidator.generateReport(postValidation)
  console.log(report)

  if (!postValidation.isValid) {
    console.error('\n❌ FALHA: XML assinado não passou na validação')
    return null
  }

  // SUCESSO
  console.log('\n✅ FLUXO COMPLETADO COM SUCESSO')
  console.log('📤 XML está pronto para envio ao SEFAZ\n')

  return {
    signedXml,
    preValidation,
    postValidation,
  }
}

// ============================================================
// EXEMPLO 4: Validação isolada para debugging
// ============================================================

export function exampleDebugValidation(xmlContent: string) {
  const validator = new FiscalXMLValidator()

  console.log('🔍 ANÁLISE DETALHADA DE VALIDAÇÃO\n')

  // Valida versão não-assinada
  const unsignedValidation = validator.validateUnsignedXML(xmlContent)

  console.log('📊 CHECKLIST PRÉ-ASSINATURA:')
  console.log(`  Well-formed: ${unsignedValidation.wellFormed ? '✓' : '✗'}`)
  console.log(`  Campos obrigatórios: ${unsignedValidation.hasMandatoryFields ? '✓' : '✗'}`)
  console.log('')

  if (unsignedValidation.errors.length > 0) {
    console.log(`❌ ERROS ENCONTRADOS (${unsignedValidation.errors.length}):\n`)
    unsignedValidation.errors.forEach((err) => {
      const severityIcon = err.severity === 'critical' ? '🔴' : '🟡'
      console.log(`${severityIcon} [${err.severity.toUpperCase()}] ${err.code}`)
      console.log(`   ${err.message}\n`)
    })
  } else {
    console.log('✅ Nenhum erro encontrado\n')
  }

  if (unsignedValidation.warnings.length > 0) {
    console.log(`⚠️  AVISOS (${unsignedValidation.warnings.length}):\n`)
    unsignedValidation.warnings.forEach((warn) => {
      console.log(`  • ${warn}`)
    })
    console.log('')
  }

  return unsignedValidation
}

// ============================================================
// EXEMPLO 5: Validar antes de transmissão final
// ============================================================

export function examplePreTransmissionCheck(signedXmlContent: string) {
  const validator = new FiscalXMLValidator()

  console.log('🔐 CHECAGEM PRÉ-TRANSMISSÃO SEFAZ\n')

  const validation = validator.validateSignedXML(signedXmlContent)

  // Checklist crítico
  const criticalChecks = [
    { label: 'XML bem-formado', pass: validation.wellFormed },
    { label: 'Campos obrigatórios presentes', pass: validation.hasMandatoryFields },
    { label: 'Assinado digitalmente', pass: validation.isSigned },
    { label: 'Assinatura válida', pass: validation.signatureValid },
  ]

  console.log('📋 CHECKLIST FINAL:\n')
  let allPass = true
  criticalChecks.forEach((check) => {
    const icon = check.pass ? '✅' : '❌'
    console.log(`${icon} ${check.label}`)
    allPass = allPass && check.pass
  })
  console.log('')

  if (!allPass) {
    console.error('❌ NÃO PODE TRANSMITIR - Corrija os problemas acima\n')
    return false
  }

  if (validation.warnings.length > 0) {
    console.log(`⚠️  AVISOS (${validation.warnings.length}):\n`)
    validation.warnings.forEach((warn) => {
      console.log(`  ⚠️  ${warn}`)
    })
    console.log('\n➡️  Prosseguir com CAUTELA\n')
  } else {
    console.log('✅ TUDO PASSOU - Seguro para transmissão ao SEFAZ\n')
  }

  return true
}
