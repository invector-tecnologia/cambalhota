export default {
  titulo: '📄 Notas Fiscais',
  conteudo: `
    <h1>Importação de Notas Fiscais</h1>

    <p>Aprenda a importar automaticamente notas fiscais de fornecedores e atualizar seu estoque.</p>

    <h2>1. O que é uma Nota Fiscal?</h2>

    <p>Um documento que comprova uma compra. Contém:</p>
    <ul>
      <li>Dados do fornecedor (CNPJ, endereço)</li>
      <li>Itens comprados</li>
      <li>Quantidades e preços</li>
      <li>Data da emissão</li>
      <li>Número sequencial único</li>
    </ul>

    <h2>2. Tipos de Notas no TAVOLO</h2>

    <h3>NFe (Nota Fiscal Eletrônica)</h3>
    <p>Pode ser importada automaticamente via arquivo XML.</p>

    <h3>Nota Manual</h3>
    <p>Você digita os dados manualmente.</p>

    <h2>3. Importando via XML</h2>

    <h3>Passo a Passo</h3>
    <ol>
      <li>O fornecedor envia a NFe em arquivo .xml</li>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Notas Fiscais"</strong></li>
      <li>Clique em <strong>"Importar XML"</strong></li>
      <li>Selecione o arquivo</li>
      <li>O TAVOLO lê automaticamente:
        <ul>
          <li>Fornecedor</li>
          <li>Todos os itens</li>
          <li>Quantidades</li>
          <li>Preços</li>
        </ul>
      </li>
      <li>Revise e clique em <strong>"Confirmar"</strong></li>
    </ol>

    <p>Estoque é atualizado imediatamente!</p>

    <h3>Onde Encontrar o XML?</h3>
    <ul>
      <li><strong>Email:</strong> Fornecedor envia anexado</li>
      <li><strong>Portal do fornecedor:</strong> Baixe na conta</li>
      <li><strong>Sua conta na receita federal:</strong> Se autorizado</li>
    </ul>

    <h2>4. Registrando Nota Manualmente</h2>

    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Notas Fiscais"</strong></li>
      <li>Clique em <strong>"Nova Nota"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Fornecedor:</strong> Escolha ou crie novo</li>
          <li><strong>Número:</strong> Da nota fiscal</li>
          <li><strong>Data:</strong> De emissão</li>
        </ul>
      </li>
      <li>Clique em <strong>"Adicionar Item"</strong> para cada produto:
        <ul>
          <li>Escolha o insumo</li>
          <li>Quantidade</li>
          <li>Preço unitário</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h2>5. Confirmando a Nota</h2>

    <p>Antes de confirmar, revise:</p>
    <ul>
      <li>✅ Itens estão corretos</li>
      <li>✅ Quantidades batem</li>
      <li>✅ Preços estão certos</li>
    </ul>

    <p>Se tudo OK, clique <strong>"Confirmar"</strong> e o estoque é atualizado.</p>

    <h2>6. Rejeitando ou Desfazendo</h2>

    <h3>Se Algo Está Errado</h3>
    <ol>
      <li>Abra a nota</li>
      <li>Clique em <strong>"Descartar"</strong> (não confirma)</li>
      <li>Recomece o processo</li>
    </ol>

    <h3>Se Já Confirmou</h3>
    <ol>
      <li>Clique em <strong>"Reverter"</strong></li>
      <li>Estoque volta ao estado anterior</li>
      <li>Edite e reconfirme</li>
    </ol>

    <h2>7. Relatório de Compras</h2>

    <p>Ver todas as notas por período:</p>
    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Compras"</strong> ou <strong>"Notas Fiscais"</strong></li>
      <li>Selecione período</li>
      <li>Veja:
        <ul>
          <li>Total gasto em compras</li>
          <li>Fornecedor com mais compras</li>
          <li>Insumo mais comprado</li>
        </ul>
      </li>
    </ol>

    <h2>8. Dicas Práticas</h2>

    <h3>📁 Organizando Arquivos</h3>
    <ul>
      <li>Crie uma pasta "XML" no seu computador</li>
      <li>Salve sempre os arquivos XML</li>
      <li>Nomeie com data: 2025-02-15_Fornecedor.xml</li>
    </ul>

    <h3>⚡ Atalho Rápido</h3>
    <ul>
      <li>Se recebe XML frequente do mesmo fornecedor</li>
      <li>Configure importação automática (se o sistema suportar)</li>
    </ul>

    <h2>9. Troubleshooting</h2>

    <h3>P: Arquivo XML não abre!</h3>
    <p>R: Verifique se é realmente um .xml válido. Peça novo arquivo ao fornecedor.</p>

    <h3>P: Importei a mesma nota 2 vezes!</h3>
    <p>R: Vá para a segunda instância, clique "Reverter" e delete.</p>

    <h3>P: Um item da nota não existe no meu estoque!</h3>
    <p>R: Crie o insumo primeiro, depois recomece a importação.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Notas bem organizadas = controle financeiro claro! 📊
    </p>
  `,
}
