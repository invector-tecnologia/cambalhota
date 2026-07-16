#!/usr/bin/env node
/**
 * Verifica status detalhado de uma nota fiscal específica
 */

import pg from 'pg'

const { Pool } = pg

async function checkNoteStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const noteNumber = process.argv[2] || '17'
    
    console.log(`\nVerificando nota número ${noteNumber}...\n`)
    
    const result = await pool.query(`
      SELECT 
        id,
        venda_id,
        fiscal_config_id,
        status,
        access_key,
        protocol_number,
        numero,
        serie,
        uf,
        xml_content IS NOT NULL as has_xml,
        LENGTH(xml_content) as xml_size,
        error_log,
        created_at,
        updated_at
      FROM fiscal_notes
      WHERE numero = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [noteNumber])

    if (result.rows.length === 0) {
      console.log(`❌ Nenhuma nota com número ${noteNumber} encontrada.`)
      return
    }

    for (const note of result.rows) {
      console.log('═'.repeat(100))
      console.log(`ID: ${note.id}`)
      console.log(`Venda ID: ${note.venda_id}`)
      console.log(`Status: ${note.status}`)
      console.log(`Chave de Acesso: ${note.access_key || 'N/A'}`)
      console.log(`Número: ${note.numero} | Série: ${note.serie} | UF: ${note.uf}`)
      console.log(`Protocolo SEFAZ: ${note.protocol_number || 'N/A'}`)
      console.log(`XML: ${note.has_xml ? `Sim (${note.xml_size} bytes)` : 'Não'}`)
      
      if (note.error_log) {
        console.log('\n🔴 Error Log:')
        console.log(JSON.stringify(note.error_log, null, 2))
      }
      
      console.log(`\nCriada: ${new Date(note.created_at).toISOString()}`)
      console.log(`Atualizada: ${new Date(note.updated_at).toISOString()}`)
      console.log('═'.repeat(100))
      console.log()
    }

    // Buscar últimos logs relacionados a essa nota
    console.log('\n📊 Estatísticas gerais:\n')
    
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM fiscal_notes
      GROUP BY status
      ORDER BY count DESC
    `)
    
    console.log('Status das notas no sistema:')
    for (const stat of stats.rows) {
      console.log(`  ${stat.status}: ${stat.count}`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkNoteStatus()
  .then(() => {
    console.log('\n✅ Análise concluída.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })
