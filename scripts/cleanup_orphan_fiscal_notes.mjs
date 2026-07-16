#!/usr/bin/env node
/**
 * Limpa notas fiscais órfãs (PENDING/ERROR sem access_key ou protocolo)
 * que não têm chance de serem autorizadas
 */

import pg from 'pg'

const { Pool } = pg

async function cleanupOrphanNotes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('Identificando notas fiscais órfãs...\n')

    // Buscar notas órfãs
    const orphansResult = await pool.query(`
      SELECT 
        id,
        numero,
        serie,
        status,
        access_key,
        protocol_number,
        xml_content IS NOT NULL as has_xml,
        created_at
      FROM fiscal_notes
      WHERE status IN ('PENDING', 'ERROR')
        AND protocol_number IS NULL
        AND (access_key IS NULL OR xml_content IS NULL)
      ORDER BY created_at ASC
    `)

    if (orphansResult.rows.length === 0) {
      console.log('✅ Nenhuma nota órfã encontrada.')
      return
    }

    console.log(`Encontradas ${orphansResult.rows.length} nota(s) órfã(s):\n`)
    console.log('─'.repeat(120))
    console.log(
      'ID'.padEnd(38) +
        'Núm'.padEnd(6) +
        'Status'.padEnd(10) +
        'Chave'.padEnd(8) +
        'XML'.padEnd(6) +
        'Criada em'
    )
    console.log('─'.repeat(120))

    for (const note of orphansResult.rows) {
      console.log(
        note.id.substring(0, 36).padEnd(38) +
          String(note.numero).padEnd(6) +
          note.status.padEnd(10) +
          (note.access_key ? 'Sim' : 'Não').padEnd(8) +
          (note.has_xml ? 'Sim' : 'Não').padEnd(6) +
          new Date(note.created_at).toISOString()
      )
    }

    console.log('\n⚠️  Essas notas não podem ser autorizadas pois:')
    console.log('   - Não têm protocolo de autorização')
    console.log('   - Não têm chave de acesso OU XML gerado')
    console.log('   - Estão em status PENDING/ERROR sem progresso\n')

    // Em ambiente de produção, só mostra - não deleta automaticamente
    if (process.env.AUTO_DELETE === 'true') {
      console.log('🗑️  Deletando notas órfãs...')
      const deleteResult = await pool.query(`
        DELETE FROM fiscal_notes
        WHERE status IN ('PENDING', 'ERROR')
          AND protocol_number IS NULL
          AND (access_key IS NULL OR xml_content IS NULL)
      `)
      console.log(`✅ ${deleteResult.rowCount} nota(s) deletada(s).`)
    } else {
      console.log(
        '💡 Para deletar automaticamente, execute: AUTO_DELETE=true node scripts/cleanup_orphan_fiscal_notes.mjs'
      )
      console.log('\nOu execute manualmente:')
      console.log(`
DELETE FROM fiscal_notes
WHERE status IN ('PENDING', 'ERROR')
  AND protocol_number IS NULL
  AND (access_key IS NULL OR xml_content IS NULL);
      `)
    }

    // Verificar nota 16 especificamente
    const note16 = orphansResult.rows.find((n) => n.numero === 16)
    if (note16) {
      console.log('\n🔍 NOTA 16 IDENTIFICADA COMO ÓRFÃ:')
      console.log(`   ID: ${note16.id}`)
      console.log(`   Status: ${note16.status}`)
      console.log(`   Chave: ${note16.access_key || 'N/A'}`)
      console.log(`   XML: ${note16.has_xml ? 'Sim' : 'Não'}`)
      console.log('\n⚠️  Esta nota precisa ser recriada corretamente.')
    }
  } catch (error) {
    console.error('Erro:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

cleanupOrphanNotes()
  .then(() => {
    console.log('\n✅ Análise concluída.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })
