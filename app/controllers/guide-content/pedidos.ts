export default {
  titulo: '📦 Processar Pedidos',
  conteudo: `
    <h1>Processar Pedidos</h1>

    <p>Este guia detalha como criar, rastrear e gerenciar pedidos no TAVOLO.</p>

    <h2>1. Criando um Pedido</h2>

    <h3>Passo a Passo</h3>
    <ol>
      <li>Abra uma comanda</li>
      <li>Clique em <strong>"Adicionar Itens"</strong></li>
      <li>Escolha o produto no cardápio</li>
      <li>Selecione a quantidade</li>
      <li>Escolha observações (ex: sem cebola)</li>
      <li>Clique em <strong>"Adicionar ao Carrinho"</strong></li>
      <li>Repita para todos os itens</li>
      <li>Clique em <strong>"Confirmar Pedidos"</strong></li>
    </ol>

    <p>Os pedidos aparecem imediatamente no <strong>Painel da Cozinha</strong>.</p>

    <h2>2. Editando um Pedido</h2>

    <h3>Adicionar Itens a um Pedido Existente</h3>
    <ol>
      <li>Abra a comanda</li>
      <li>Clique em <strong>"Adicionar Mais Itens"</strong></li>
      <li>Selecione novos produtos</li>
      <li>Confirme</li>
    </ol>

    <h3>Remover ou Aumentar Quantidade</h3>
    <ol>
      <li>Na comanda, veja a lista de itens</li>
      <li>Use os botões <strong>+ e -</strong> para ajustar quantidade</li>
      <li>Ou clique no item e escolha <strong>"Remover"</strong></li>
      <li>Clique em <strong>"Salvar Mudanças"</strong></li>
    </ol>

    <h2>3. Status dos Pedidos</h2>

    <table>
      <tr>
        <th>Status</th>
        <th>Significado</th>
        <th>Próximo Status</th>
      </tr>
      <tr>
        <td><strong>📋 Pendente</strong></td>
        <td>Criado, na fila da cozinha</td>
        <td>Confirmado (cozinheiro recebe)</td>
      </tr>
      <tr>
        <td><strong>👨‍🍳 Preparando</strong></td>
        <td>Cozinheiro está fazendo</td>
        <td>Pronto (saiu da cozinha)</td>
      </tr>
      <tr>
        <td><strong>✅ Pronto</strong></td>
        <td>Pronto para servir</td>
        <td>Servido (garçom entregou)</td>
      </tr>
      <tr>
        <td><strong>🍽️ Servido</strong></td>
        <td>Entregue ao cliente</td>
        <td>Fechamento da comanda</td>
      </tr>
      <tr>
        <td><strong>💳 Pago</strong></td>
        <td>Cliente pagou</td>
        <td>-</td>
      </tr>
      <tr>
        <td><strong>❌ Cancelado</strong></td>
        <td>Pedido foi cancelado</td>
        <td>-</td>
      </tr>
    </table>

    <h2>4. Acompanhando Pedidos</h2>

    <h3>Na Comanda</h3>
    <p>Você vê cada item da comanda com seu status:</p>
    <ul>
      <li>🟡 Pendente</li>
      <li>🔵 Preparando</li>
      <li>🟢 Pronto</li>
    </ul>

    <h3>No Painel da Cozinha</h3>
    <p>Cozinheiro vê os pedidos organizados em colunas e os move conforme avança.</p>

    <h3>Buscar Pedido Específico</h3>
    <ol>
      <li>Vá para <strong>"Pedidos"</strong> no menu</li>
      <li>Use a barra de busca para encontrar por:
        <ul>
          <li>Número de comanda</li>
          <li>Nome do prato</li>
          <li>Nome do cliente</li>
        </ul>
      </li>
    </ol>

    <h2>5. Observações Especiais</h2>

    <h3>Adicionando Observações</h3>
    <p>Ao criar um pedido ou item, você pode adicionar observações:</p>
    <ul>
      <li>🔥 Bem passado</li>
      <li>❄️ Sem gelo</li>
      <li>🚫 Sem cebola</li>
      <li>🥔 Extra batata frita</li>
    </ul>

    <h3>Como Adicionar</h3>
    <ol>
      <li>Ao selecionar um item, procure o campo <strong>"Observação"</strong></li>
      <li>Digite a observação especial</li>
      <li>Confirme o item</li>
      <li>A observação aparecerá destacada em amarelo na cozinha</li>
    </ol>

    <h2>6. Cancelando Pedidos</h2>

    <h3>Antes de Preparar</h3>
    <ol>
      <li>Na comanda, encontre o item</li>
      <li>Clique em <strong>"Cancelar"</strong></li>
      <li>Escolha um motivo (Cliente pediu, engano, etc.)</li>
      <li>Confirme</li>
    </ol>

    <p>O item é removido da comanda e o preço é abatido.</p>

    <h3>Depois de Preparar</h3>
    <p>Se o pedido já estava pronto, só <strong>gerente</strong> pode cancelar.</p>
    <ol>
      <li>Clique no item pronto</li>
      <li>Clique em <strong>"Cancelar Venda"</strong> (só gerente vê isso)</li>
      <li>Confirme a remoção</li>
    </ol>

    <h2>7. Compartilhando Pedidos</h2>

    <h3>Dividindo um Prato</h3>
    <p>Vários clientes compartilhando um prato:</p>
    <ol>
      <li>Ao finalizar, marque <strong>"Dividido"</strong></li>
      <li>Escolha quantas pessoas dividem</li>
      <li>O preço é dividido automaticamente</li>
    </ol>

    <h2>8. Relatório de Pedidos</h2>

    <p>Para análise posterior:</p>
    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Pedidos"</strong></li>
      <li>Selecione período</li>
      <li>Veja:
        <ul>
          <li>Total de pedidos</li>
          <li>Pratos mais vendidos</li>
          <li>Tempo médio de preparação</li>
          <li>Taxa de cancelamento</li>
        </ul>
      </li>
    </ol>

    <h2>9. Dicas Práticas</h2>

    <h3>⚡ Acelerando Pedidos</h3>
    <ul>
      <li>Use atalhos rápidos para pratos populares</li>
      <li>Organize cardápio por frequência</li>
      <li>Marque favoritos para acesso rápido</li>
    </ul>

    <h3>📱 Mobile</h3>
    <ul>
      <li>Sistema funciona perfeitamente em tablets</li>
      <li>Ideal para garçons circularem tomando pedidos</li>
      <li>Sincronização automática</li>
    </ul>

    <h2>10. Troubleshooting</h2>

    <h3>P: Criei um pedido por engano!</h3>
    <p>R: Rápido! Antes de confirmar, remova os itens do carrinho. Se já confirmou, cancele os itens.</p>

    <h3>P: Um pedido sumiu do painel da cozinha!</h3>
    <p>R: Provavelmente foi marcado como servido. Vá para "Pedidos" completos para ver histórico.</p>

    <h3>P: Posso agendar um pedido para depois?</h3>
    <p>R: Sim! Ao criar, escolha <strong>"Agendar para depois"</strong> e selecione o horário.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Pedidos bem gerenciados = clientes felizes! 😊
    </p>
  `,
}
