#!/usr/bin/env node
/**
 * Verifica a sequência de numeração de notas fiscais e compara com next_nfe_number
 */

import pg from 'pg'

const { Pool } = pg

async function checkFiscalSequence() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('Consultando últimas notas fiscais e configuração...\n')

    // Query para pegar últimas notas e configuração
    const result = await pool.query(`
      SELECT 
        fn.id,
        fn.numero,
        fn.serie,
        fn.access_key,
        fn.protocol_number,
        fn.status,
        fn.created_at,
        fc.next_nfe_number,
        fc.establishment_id
      FROM fiscal_notes fn
      JOIN fiscal_configs fc ON fn.fiscal_config_id = fc.id
      WHERE fn.numero IS NOT NULL
      ORDER BY fn.numero DESC
      LIMIT 30
    `)

    if (result.rows.length === 0) {
      console.log('Nenhuma nota fiscal encontrada.')
      return
    }

    console.log('Últimas Notas Fiscais:')
    console.log('======================\n')

    // Agrupar por establishment_id
    const byEstablishment = {}
    for (const row of result.rows) {
      const estId = row.establishment_id
      if (!byEstablishment[estId]) {
        byEstablishment[estId] = []
      }
      byEstablishment[estId].push(row)
    }

    // Mostrar cada estabelecimento
    for (const [estId, notes] of Object.entries(byEstablishment)) {
      console.log(`\nEstabelecimento ID: ${estId}`)
      console.log(`Próximo nNF configurado: ${notes[0].next_nfe_number}`)
      console.log(`Última nota emitida: ${notes[0].numero}`)
      console.log('\nDetalhes das últimas notas:')
      console.log(
        '─'.repeat(150)
      )
      console.log(
        'ID'.padEnd(8) +
          'Número'.padEnd(10) +
          'Série'.padEnd(8) +
          'Status'.padEnd(15) +
          'Chave de Acesso'.padEnd(50) +
          'Data Criação'
      )
      console.log('─'.repeat(150))

      for (const note of notes) {
        console.log(
          String(note.id).padEnd(8) +
            String(note.numero).padEnd(10) +
            String(note.serie).padEnd(8) +
            note.status.padEnd(15) +
            (note.access_key || 'N/A').padEnd(50) +
            new Date(note.created_at).toISOString()
        )
      }

      // Análise de gaps e duplicatas
      const numeros = notes.map((n) => n.numero).sort((a, b) => a - b)
      const duplicates = numeros.filter((n, i) => numeros.indexOf(n) !== i)
      if (duplicates.length > 0) {
        console.log(`\n⚠️  NÚMEROS DUPLICADOS: ${[...new Set(duplicates)].join(', ')}`)
      }

      // Verificar se next_nfe_number é inconsistente
      const maxNumero = Math.max(...numeros)
      if (notes[0].next_nfe_number <= maxNumero) {
        console.log(
          `\n🔴 INCONSISTÊNCIA: next_nfe_number (${notes[0].next_nfe_number}) é menor ou igual ao maior número usado (${maxNumero})`
        )
        console.log(`   Sugestão: Atualizar next_nfe_number para ${maxNumero + 1}`)
      } else {
        console.log(
          `\n✅ Sequência consistente: next_nfe_number (${notes[0].next_nfe_number}) > maior número usado (${maxNumero})`
        )
      }
    }

    // Buscar especificamente a nota 16 para o CNPJ em questão
    console.log('\n\nVerificando nota número 16 especificamente...')
    console.log('='.repeat(150))

    const note16Result = await pool.query(
      `
      SELECT 
        fn.id,
        fn.numero,
        fn.serie,
        fn.access_key,
        fn.protocol_number,
        fn.status,
        fn.xml_content IS NOT NULL as has_xml,
        fn.created_at,
        fn.updated_at,
        e.cnpj
      FROM fiscal_notes fn
      JOIN fiscal_configs fc ON fn.fiscal_config_id = fc.id
      JOIN establishments e ON fc.establishment_id = e.id
      WHERE fn.numero = 16
      ORDER BY fn.created_at DESC
    `
    )

    if (note16Result.rows.length > 0) {
      console.log(`\nEncontradas ${note16Result.rows.length} nota(s) com número 16:\n`)
      for (const note of note16Result.rows) {
        console.log(`ID: ${note.id}`)
        console.log(`CNPJ: ${note.cnpj}`)
        console.log(`Série: ${note.serie}`)
        console.log(`Status: ${note.status}`)
        console.log(`Chave de Acesso: ${note.access_key || 'N/A'}`)
        console.log(`Protocolo: ${note.protocol_number || 'N/A'}`)
        console.log(`Tem XML: ${note.has_xml ? 'Sim' : 'Não'}`)
        console.log(`Criada em: ${new Date(note.created_at).toISOString()}`)
        console.log(`Atualizada em: ${new Date(note.updated_at).toISOString()}`)
        console.log('─'.repeat(100))
      }

      // Se houver nota 16 com CNPJ específico, verificar a chave
      const note16cnpj = note16Result.rows.find((n) => n.cnpj === '31968879000193')
      if (note16cnpj) {
        console.log('\n🔍 ANÁLISE DA NOTA 16 PARA CNPJ 31968879000193:')
        console.log(`   Chave no banco: ${note16cnpj.access_key || 'N/A'}`)
        console.log(`   Chave no SEFAZ: 33250131968879000193650010000000161995452048`)
        console.log(
          `   ${note16cnpj.access_key === '33250131968879000193650010000000161995452048' ? '✅ CORRESPONDEM' : '❌ DIVERGENTES'}`
        )
      }
    } else {
      console.log('\nNenhuma nota com número 16 encontrada.')
    }
  } catch (error) {
    console.error('Erro ao consultar banco:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkFiscalSequence()
  .then(() => {
    console.log('\n✅ Análise concluída.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })
