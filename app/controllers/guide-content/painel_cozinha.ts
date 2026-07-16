export default {
  titulo: '👨‍🍳 Painel da Cozinha',
  conteudo: `
    <h1>Painel da Cozinha - Gerenciar Produção</h1>

    <p>O <strong>Painel da Cozinha</strong> é onde o cozinheiro vê todos os pedidos que precisa preparar, organizado por status e prioridade.</p>

    <h2>1. Acessando o Painel</h2>

    <ol>
      <li>No menu principal, clique em <strong>"Cozinha"</strong></li>
      <li>Você verá todos os pedidos do restaurante</li>
    </ol>

    <p>O painel atualiza <strong>em tempo real</strong> - assim que um garçom cria um pedido, aparece automaticamente.</p>

    <h2>2. Entendendo a Visualização Kanban</h2>

    <p>Os pedidos são organizados em colunas por status:</p>

    <h3>📋 Pendente</h3>
    <p>Novos pedidos que chegaram. O cozinheiro ainda não começou.</p>

    <h3>👨‍🍳 Preparando</h3>
    <p>Pedidos que o cozinheiro já está fazendo.</p>

    <h3>✅ Pronto</h3>
    <p>Pronto para servir. Pedido saiu da cozinha.</p>

    <h2>3. Movendo Pedidos Entre Status</h2>

    <h3>De Pendente para Preparando</h3>
    <ol>
      <li>Veja um pedido na coluna "Pendente"</li>
      <li>Clique nele para ver detalhes</li>
      <li>Clique em <strong>"Começar Preparação"</strong></li>
      <li>O pedido se move para "Preparando"</li>
    </ol>

    <h3>De Preparando para Pronto</h3>
    <ol>
      <li>Quando terminou de cozinhar, abra o pedido em "Preparando"</li>
      <li>Clique em <strong>"Marcar como Pronto"</strong></li>
      <li>Um aviso visual/sonoro notifica o garçom</li>
      <li>O pedido vai para "Pronto"</li>
    </ol>

    <h2>4. Informações do Pedido</h2>

    <p>Cada card de pedido mostra:</p>
    <ul>
      <li><strong>Número da Comanda:</strong> #1024</li>
      <li><strong>Número do Pedido:</strong> para rastrear entre múltiplos itens</li>
      <li><strong>Cliente:</strong> se foi registrado</li>
      <li><strong>Items:</strong> O que precisa fazer (Moqueca, Arroz, etc.)</li>
      <li><strong>Observações:</strong> Pedidos especiais (sem sal, sem cebola, etc.)</li>
      <li><strong>Tempo:</strong> Quanto tempo o pedido está aguardando</li>
    </ul>

    <h2>5. Prioridades</h2>

    <p>Alguns pedidos podem ter <strong>prioridade alta</strong>:</p>

    <ul>
      <li>Pedidos marcados como "Urgente"</li>
      <li>Clientes VIP</li>
      <li>Pedidos que já estão esperando há muito tempo</li>
    </ul>

    <p>Esses aparecerão <strong>destacados em vermelho</strong> para chamar atenção.</p>

    <h2>6. Observações e Restrições</h2>

    <h3>Vendo Obs Especiais</h3>
    <p>Cada item pode ter uma observação especial:</p>
    <ul>
      <li>⚠️ <strong>Sem cebola</strong></li>
      <li>⚠️ <strong>Sem alho</strong></li>
      <li>⚠️ <strong>Ponto inglês</strong> (para carnes)</li>
      <li>⚠️ <strong>Glúten free</strong></li>
    </ul>

    <p>As observações aparecem <strong>destacadas em amarelo</strong> no pedido.</p>

    <h2>7. Cancelando Pedidos</h2>

    <p><strong>Cenário:</strong> O cliente mudou de ideia antes de começar.</p>

    <ol>
      <li>Abra o pedido na coluna "Pendente"</li>
      <li>Clique em <strong>"Cancelar Pedido"</strong></li>
      <li>Digite o motivo (opcional)</li>
      <li>Confirme</li>
    </ol>

    <p>Um aviso em <strong>vermelho</strong> notifica a garçom que o pedido foi cancelado.</p>

    <h2>8. Filtros e Busca</h2>

    <p>Para encontrar pedidos específicos:</p>

    <h3>Filtrar Por:</h3>
    <ul>
      <li>🪑 <strong>Mesa:</strong> Mesa 5, Mesa 10</li>
      <li>👤 <strong>Cliente:</strong> João Silva</li>
      <li>⏱️ <strong>Tempo:</strong> Últimas 2 horas, Hoje, etc.</li>
      <li>🏷️ <strong>Tipo de Pedido:</strong> Salão, Delivery, Retirada</li>
    </ul>

    <h3>Buscar por:</h3>
    <ul>
      <li>Número de comanda (ex: #1024)</li>
      <li>Nome do prato (ex: "moqueca")</li>
    </ul>

    <h2>9. Dicas para a Cozinha</h2>

    <h3>⏱️ Gerenciar Tempo</h3>
    <ul>
      <li>O sistema mostra quanto tempo cada pedido está na fila</li>
      <li>Use isso para priorizar pedidos antigos</li>
      <li>Prato que leva 5min? Deixa para último se der</li>
    </ul>

    <h3>👀 Visualização Clara</h3>
    <ul>
      <li>A tela é grande e clara para ler de longe</li>
      <li>Tamanho do texto é ajustável</li>
      <li>Cores chamativas para alertas e urgências</li>
    </ul>

    <h3>🔔 Notificações Automáticas</h3>
    <ul>
      <li>Som toca quando novo pedido chega</li>
      <li>Notificação visual quando algo é cancelado</li>
      <li>Aviso se pedido espera há muito tempo</li>
    </ul>

    <h2>10. Estatísticas da Cozinha</h2>

    <p>Ao final do dia, veja:</p>
    <ul>
      <li>📊 Total de pedidos processados</li>
      <li>⏱️ Tempo médio de preparação</li>
      <li>🎯 Prato mais pedido</li>
      <li>❌ Taxa de cancelamento</li>
    </ul>

    <blockquote>
      <strong>Dica:</strong> Use essas estatísticas para melhorar processos na cozinha!
    </blockquote>

    <h2>11. Troubleshooting</h2>

    <h3>P: Não estou ouvindo o som de novo pedido!</h3>
    <p>R: Verifique se o som do navegador está ativado. Clique no ícone de volume no seu navegador.</p>

    <h3>P: Um pedido desapareceu! Aonde foi?</h3>
    <p>R: Provavelmente foi cancelado ou já foi marcado como pronto e servido. Vá para "Pedidos" completos para ver histórico.</p>

    <h3>P: Posso ver quantas pessoas estão na fila?</h3>
    <p>R: Sim! O painel mostra o total de pedidos em cada coluna (Pendente, Preparando, Pronto).</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Com o painel da cozinha, seus pedidos fluem melhor! Bom trabalho! 👍
    </p>
  `,
}
