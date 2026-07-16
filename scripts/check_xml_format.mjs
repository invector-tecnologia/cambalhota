#!/usr/bin/env node
/**
 * Verifica formato do XML e extração da chave de acesso
 */

import pg from 'pg'

const { Pool } = pg

async function checkXmlFormat() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const result = await pool.query(`
      SELECT id, xml_content, access_key, numero
      FROM fiscal_notes
      WHERE xml_content IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 3
    `)

    if (result.rows.length === 0) {
      console.log('Nenhum XML encontrado.')
      return
    }

    for (const row of result.rows) {
      console.log('\n' + '='.repeat(100))
      console.log(`ID: ${row.id}`)
      console.log(`Número: ${row.numero || 'N/A'}`)
      console.log(`Access Key no banco: ${row.access_key || 'N/A'}`)
      console.log('\nXML Preview (primeiros 800 chars):')
      console.log('-'.repeat(100))
      console.log(row.xml_content.substring(0, 800))
      console.log('-'.repeat(100))

      // Testar diferentes regexes
      const regex1 = /<infNFe\b[^>]*\bId=["']NFe(\d{44})["']/i
      const regex2 = /<infNFe[^>]*Id="NFe(\d{44})"/i
      const regex3 = /Id="NFe(\d{44})"/i

      const match1 = row.xml_content.match(regex1)
      const match2 = row.xml_content.match(regex2)
      const match3 = row.xml_content.match(regex3)

      console.log('\nTestes de extração:')
      console.log(`  Regex 1 (atual): ${match1 ? match1[1] : 'NO MATCH'}`)
      console.log(`  Regex 2 (simples): ${match2 ? match2[1] : 'NO MATCH'}`)
      console.log(`  Regex 3 (muito simples): ${match3 ? match3[1] : 'NO MATCH'}`)

      if (match1 && row.access_key && match1[1] !== row.access_key) {
        console.log(`\n⚠️  DIVERGÊNCIA: XML tem ${match1[1]} mas banco tem ${row.access_key}`)
      }
    }
  } catch (error) {
    console.error('Erro:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkXmlFormat()
  .then(() => {
    console.log('\n✅ Análise concluída.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })
