export default {
  titulo: '🏭 Gestão de Insumos',
  conteudo: `
    <h1>Gestão de Insumos - Controle de Estoque</h1>

    <p>Aprenda a gerenciar o estoque de ingredientes (insumos) do seu restaurante.</p>

    <h2>1. O que é um Insumo?</h2>

    <p>Um insumo é qualquer ingrediente que você usa para fazer seus pratos:</p>

    <ul>
      <li>Carnes (Frango, Carne, Peixe)</li>
      <li>Vegetais e Frutas</li>
      <li>Bebidas</li>
      <li>Temperos e Condimentos</li>
      <li>Óleos e Gorduras</li>
      <li>Laticínios</li>
    </ul>

    <h2>2. Criando um Insumo</h2>

    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Insumos"</strong></li>
      <li>Clique em <strong>"Novo Insumo"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Nome:</strong> Ex: "Frango Inteiro"</li>
          <li><strong>Categoria:</strong> Ex: "Carnes"</li>
          <li><strong>Unidade:</strong> kg, L, unid., dúzia, etc.</li>
          <li><strong>Quantidade Atual:</strong> Quanto você tem agora</li>
          <li><strong>Custo Unitário:</strong> Quanto custa 1 kg (ou unidade)</li>
          <li><strong>Mínimo:</strong> Quando avisar que tá acabando (ex: 5 kg)</li>
          <li><strong>Máximo:</strong> Limite para não comprar demais (ex: 30 kg)</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h2>3. Registrando Compras (Notas Fiscais)</h2>

    <h3>Importar via XML</h3>
    <p>Se o fornecedor enviou uma nota fiscal eletrônica (XML):</p>

    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Notas Fiscais"</strong></li>
      <li>Clique em <strong>"Importar XML"</strong></li>
      <li>Selecione o arquivo do seu computador</li>
      <li>O TAVOLO extrai automaticamente:
        <ul>
          <li>Itens comprados</li>
          <li>Quantidades</li>
          <li>Valores</li>
        </ul>
      </li>
      <li>Confirme e o estoque é atualizado</li>
    </ol>

    <h3>Registrar Manualmente</h3>
    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Notas Fiscais"</strong></li>
      <li>Clique em <strong>"Nova Nota Fiscal"</strong></li>
      <li>Preencha:
        <ul>
          <li>Fornecedor</li>
          <li>Data da nota</li>
          <li>Número da nota</li>
        </ul>
      </li>
      <li>Clique em <strong>"Adicionar Item"</strong></li>
      <li>Para cada insumo comprado:
        <ul>
          <li>Escolha o insumo</li>
          <li>Quantidade comprada</li>
          <li>Preço unitário</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <p>O estoque é atualizado automaticamente.</p>

    <h2>4. Usando Insumos (Receitas)</h2>

    <p>Quando você liga um insumo a um produto através da receita, o estoque diminui automaticamente quando vende:</p>

    <ol>
      <li>Vá para <strong>"Cardápio"</strong> → <strong>"Produtos"</strong></li>
      <li>Abra um produto</li>
      <li>Clique em <strong>"Receita"</strong></li>
      <li>Clique em <strong>"Adicionar Ingrediente"</strong></li>
      <li>Escolha um insumo (ex: "Frango Inteiro")</li>
      <li>Digite quanto usa (ex: 0.5 kg)</li>
      <li>Salve</li>
    </ol>

    <p><strong>Resultado:</strong> Se você vender um prato que leva 0,5 kg de frango, o estoque automático diminui 0,5 kg.</p>

    <h2>5. Alertas de Estoque</h2>

    <h3>Alerta Mínimo</h3>
    <p>Quando estoque cai abaixo do mínimo, você vê:</p>
    <ul>
      <li>🔴 Indicador vermelho no insumo</li>
      <li>⚠️ Notificação avisando que precisa comprar</li>
    </ul>

    <h3>Alerta Máximo</h3>
    <p>Quando você tem mais que o máximo configurado:</p>
    <ul>
      <li>🟡 Indicador amarelo</li>
      <li>📌 Aviso de que tem excesso</li>
    </ul>

    <h3>Configurando os Limites</h3>
    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Insumos"</strong></li>
      <li>Encontre o insumo</li>
      <li>Clique em <strong>"Editar"</strong></li>
      <li>Configure:
        <ul>
          <li><strong>Quantidade Mínima:</strong> Ex: 5 kg</li>
          <li><strong>Quantidade Máxima:</strong> Ex: 30 kg</li>
        </ul>
      </li>
      <li>Salve</li>
    </ol>

    <h2>6. Movimentação Manual de Estoque</h2>

    <h3>Adicionar Quantidade (Compra não registrada via nota)</h3>
    <ol>
      <li>Abra o insumo</li>
      <li>Clique em <strong>"Adicionar Estoque"</strong></li>
      <li>Digite a quantidade</li>
      <li>Escolha o motivo: "Compra", "Ajuste", "Devolução", etc.</li>
      <li>Confirme</li>
    </ol>

    <h3>Remover Quantidade (Desperdício, danificação)</h3>
    <ol>
      <li>Abra o insumo</li>
      <li>Clique em <strong>"Remover Estoque"</strong></li>
      <li>Digite a quantidade</li>
      <li>Escolha o motivo: "Danificado", "Desperdício", "Expirado", etc.</li>
      <li>Confirme</li>
    </ol>

    <h2>7. Categorias de Insumos</h2>

    <p>Organize seus insumos por categoria para melhor controle:</p>

    <table>
      <tr>
        <th>Categoria</th>
        <th>Exemplos</th>
      </tr>
      <tr>
        <td><strong>Carnes</strong></td>
        <td>Frango, Carne Vermelha, Peixe</td>
      </tr>
      <tr>
        <td><strong>Vegetais</strong></td>
        <td>Cebola, Cenoura, Alface</td>
      </tr>
      <tr>
        <td><strong>Bebidas</strong></td>
        <td>Sucos, Refrigerantes, Cervejas</td>
      </tr>
      <tr>
        <td><strong>Temperos</strong></td>
        <td>Sal, Pimenta, Orégano</td>
      </tr>
      <tr>
        <td><strong>Óleos</strong></td>
        <td>Azeite, Óleo de Soja</td>
      </tr>
    </table>

    <h2>8. Histórico de Movimentação</h2>

    <p>Ver tudo que aconteceu com um insumo:</p>

    <ol>
      <li>Abra o insumo</li>
      <li>Clique em <strong>"Histórico"</strong></li>
      <li>Veja:
        <ul>
          <li>Data de cada movimento</li>
          <li>Quantidade</li>
          <li>Motivo (Compra, Venda, Ajuste, etc.)</li>
          <li>Saldo resultante</li>
        </ul>
      </li>
    </ol>

    <h2>9. Relatórios de Estoque</h2>

    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Estoque"</strong></li>
      <li>Veja:
        <ul>
          <li>Valor total do estoque (R$)</li>
          <li>Insumos em falta</li>
          <li>Insumos com excesso</li>
          <li>Produtos com mais consumo</li>
        </ul>
      </li>
    </ol>

    <h2>10. Dicas Práticas</h2>

    <h3>🔢 Conferindo Estoque</h3>
    <ul>
      <li>Faça inventário física regularmente (semanal ou mensal)</li>
      <li>Compare com o sistema e ajuste se diferenças</li>
      <li>Registre o motivo do ajuste (perda, engano, etc.)</li>
    </ul>

    <h3>💰 Controle de Custos</h3>
    <ul>
      <li>Monitore preços de fornecedores</li>
      <li>Se preço mudar, atualize no TAVOLO</li>
      <li>Use as margens para validar preço de venda</li>
    </ul>

    <h3>📋 Unidades de Medida</h3>
    <ul>
      <li>Seja consistente (kg sempre, ou sempre g)</li>
      <li>Facilita rastreamento e contas</li>
    </ul>

    <h2>11. Troubleshooting</h2>

    <h3>P: Meu estoque não bate com a realidade!</h3>
    <p>R: Faça uma contagem física e registre ajustes com o motivo exato.</p>

    <h3>P: Importei 2 vezes a mesma nota!</h3>
    <p>R: Vá para "Histórico" da nota e delete o duplicado.</p>

    <h3>P: Um insumo nunca menos, só aumenta!</h3>
    <p>R: Provavelmente não está ligado na receita de nenhum produto. Verifique o cardápio.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Um estoque bem controlado evita desperdícios e mantém custos baixos! 📈
    </p>
  `,
}
