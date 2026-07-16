export default {
  titulo: '🚀 Início Rápido - Primeiros Passos no TAVOLO',
  conteudo: `
    <h1>Início Rápido - Primeiros Passos no TAVOLO</h1>
    
    <p><strong>Bem-vindo ao TAVOLO!</strong> Este guia o ajudará a aprender os conceitos básicos e dar seus primeiros passos no sistema. Tempo de leitura: <strong>15 minutos</strong></p>

    <h2>1. Login e Dashboard Principal</h2>

    <h3>Acessando o Sistema</h3>
    <ol>
      <li>Abra o navegador e acesse a URL do TAVOLO</li>
      <li>Digite seu <strong>email</strong> e <strong>senha</strong></li>
      <li>Clique em <strong>Entrar</strong></li>
    </ol>

    <blockquote>
      <strong>💡 Primeira vez?</strong> Solicite suas credenciais ao gerente ou administrador
    </blockquote>

    <h3>O Dashboard</h3>
    <p>Após login, você verá a <strong>tela principal</strong> com:</p>
    <ul>
      <li><strong>Navegação superior:</strong> Menu com os módulos principais</li>
      <li><strong>Widgets principais:</strong> Resumo de vendas, caixa aberto, pedidos pendentes</li>
      <li><strong>Atalhos rápidos:</strong> Acesso direto às funções mais usadas</li>
    </ul>

    <h2>2. Conceitos Fundamentais</h2>

    <p>Antes de começar, entenda esses 4 conceitos-chave:</p>

    <h3>🪑 <strong>Mesa</strong></h3>
    <p>Uma localização física no restaurante (ex: Mesa 1, Mesa 10, Balcão).</p>

    <h3>📋 <strong>Comanda</strong></h3>
    <p>Um "anotador" de pedidos de uma mesa ou cliente. Uma mesa pode ter várias comandas abertas simultaneamente.</p>

    <h3>🛒 <strong>Pedido</strong></h3>
    <p>Um item específico solicitado por um cliente (ex: 1x Moqueca + 2x Refrigerante).</p>

    <h3>💳 <strong>Venda</strong></h3>
    <p>O registro do pagamento final de uma comanda. Inclui valor, forma de pagamento (dinheiro, cartão, PIX) e data/hora.</p>

    <h2>3. Navegação Principal</h2>

    <p>O menu superior tem estes módulos principais:</p>

    <table>
      <tr>
        <th>Módulo</th>
        <th>O que você faz</th>
      </tr>
      <tr>
        <td><strong>🏠 Home</strong></td>
        <td>Dashboard principal com resumos</td>
      </tr>
      <tr>
        <td><strong>🪑 Mesas</strong></td>
        <td>Gerenciar mesas do restaurante</td>
      </tr>
      <tr>
        <td><strong>📋 Comandas</strong></td>
        <td>Criar e gerenciar comandas</td>
      </tr>
      <tr>
        <td><strong>🍽️ Cardápio</strong></td>
        <td>Organizar produtos e categorias</td>
      </tr>
      <tr>
        <td><strong>🛒 Pedidos</strong></td>
        <td>Ver todos os pedidos do sistema</td>
      </tr>
      <tr>
        <td><strong>💰 Vendas</strong></td>
        <td>Registrar pagamentos</td>
      </tr>
      <tr>
        <td><strong>💵 Caixa</strong></td>
        <td>Abrir, registrar e fechar caixa</td>
      </tr>
      <tr>
        <td><strong>📦 Estoque</strong></td>
        <td>Gerenciar insumos e fornecedores</td>
      </tr>
    </table>

    <h2>4. Seu Primeiro Pedido (Fluxo Completo)</h2>

    <p>Vamos praticar criando e encerrando um pedido:</p>

    <h3>Passo 1: Escolha uma Mesa</h3>
    <ol>
      <li>Clique em <strong>"Mesas"</strong> no menu</li>
      <li>Selecione <strong>"Mesa 1"</strong> (ou qualquer mesa disponível)</li>
      <li>Clique em <strong>"Abrir Comanda"</strong></li>
    </ol>

    <h3>Passo 2: Crie uma Comanda</h3>
    <p>A comanda abre automaticamente com um número (ex: #1234).</p>

    <h3>Passo 3: Adicione Pedidos</h3>
    <ol>
      <li>Clique em <strong>"Adicionar Pedidos"</strong></li>
      <li>Busque um item no cardápio (ex: "Frango Frito")</li>
      <li>Selecione quantidade (ex: 2)</li>
      <li>Clique em <strong>"Adicionar ao Carrinho"</strong></li>
      <li>Repita para outros itens</li>
      <li>Clique em <strong>"Salvar Pedidos"</strong></li>
    </ol>

    <p>Os pedidos aparecerão no <strong>Painel da Cozinha</strong> em status "Pendente".</p>

    <h3>Passo 4: Acompanhe</h3>
    <ol>
      <li>Vá para <strong>"Painel da Cozinha"</strong></li>
      <li>Veja o pedido em <strong>"A Preparar"</strong></li>
      <li>Cozinheiro atualiza para <strong>"Pronto"</strong></li>
      <li>Veja na comanda status <strong>"Pronto"</strong></li>
    </ol>

    <h3>Passo 5: Feche a Comanda</h3>
    <ol>
      <li>Volte para a Comanda</li>
      <li>Clique em <strong>"Fechar Comanda"</strong></li>
      <li>Confirme o total: R$ XX,XX</li>
      <li>Escolha forma de pagamento: Dinheiro/Cartão/PIX</li>
      <li>Clique em <strong>"Registrar Venda"</strong></li>
    </ol>

    <p><strong>Pronto!</strong> A venda foi registrada e o caixa atualizado. ✅</p>

    <h2>5. Entendendo os Status</h2>

    <table>
      <tr>
        <th>Status</th>
        <th>Significa</th>
        <th>Quem pode mudar</th>
      </tr>
      <tr>
        <td>🟡 <strong>Pendente</strong></td>
        <td>Esperando a cozinha receber</td>
        <td>Sistema (automático)</td>
      </tr>
      <tr>
        <td>🔵 <strong>Confirmado</strong></td>
        <td>Cozinha recebeu e vai preparar</td>
        <td>Cozinheiro</td>
      </tr>
      <tr>
        <td>🔶 <strong>Preparando</strong></td>
        <td>Cozinha está fazendo</td>
        <td>Cozinheiro</td>
      </tr>
      <tr>
        <td>🟢 <strong>Pronto</strong></td>
        <td>Pronto para servir</td>
        <td>Garçom</td>
      </tr>
      <tr>
        <td>⚪ <strong>Servido</strong></td>
        <td>Já entregue ao cliente</td>
        <td>Garçom</td>
      </tr>
      <tr>
        <td>💚 <strong>Pago</strong></td>
        <td>Cliente pagou</td>
        <td>Sistema (automático)</td>
      </tr>
      <tr>
        <td>🔴 <strong>Cancelado</strong></td>
        <td>Foi cancelado</td>
        <td>Gerente/Garçom</td>
      </tr>
    </table>

    <h2>6. Tipo de Pedidos</h2>

    <p>O TAVOLO suporta 3 tipos de pedidos:</p>

    <h3>🪑 Salão</h3>
    <p>Cliente sentado no restaurante em uma mesa.</p>

    <h3>🏃 Retirada</h3>
    <p>Cliente faz o pedido e retira depois (takeout).</p>

    <h3>🚚 Delivery</h3>
    <p>Pedido para entregar na casa do cliente.</p>

    <blockquote>
      Você escolhe o tipo ao criar a comanda!
    </blockquote>

    <h2>7. Papel de Cada Um</h2>

    <p>Dependendo de seu <strong>papel</strong> no sistema, tem limites:</p>

    <h3>👔 Garçom</h3>
    <ul>
      <li>✅ Ver mesas e comandas</li>
      <li>✅ Criar pedidos</li>
      <li>✅ Fechar comandas e registrar vendas</li>
      <li>❌ Não pode ver estoque ou editar cardápio</li>
    </ul>

    <h3>📊 Gerente</h3>
    <ul>
      <li>✅ Tudo de Garçom</li>
      <li>✅ Ver relatórios financeiros</li>
      <li>✅ Abrir e fechar caixa</li>
      <li>✅ Cancelar vendas</li>
    </ul>

    <h3>👨‍💼 Admin</h3>
    <ul>
      <li>✅ Tudo no sistema!</li>
      <li>✅ Editar usuários e permissões</li>
      <li>✅ Editar cardápio e insumos</li>
    </ul>

    <h2>8. Dicas Importantes</h2>

    <h3>📱 Tela Responsiva</h3>
    <p>O sistema funciona em <strong>desktop, tablet e smartphone</strong>.</p>

    <h3>🔔 Notificações</h3>
    <ul>
      <li>Novos pedidos na cozinha = som de alerta</li>
      <li>Pedido pronto = notificação visual</li>
    </ul>

    <h3>🔄 Atualização em Tempo Real</h3>
    <p>Não precisa recarregar! As informações atualizam sozinhas.</p>

    <h3>💾 Dados Salvam Automaticamente</h3>
    <p>Você não perde dados mesmo se a conexão cair por alguns segundos.</p>

    <h2>9. Próximos Passos</h2>

    <p>Agora que você entendeu o básico, explore os outros guias:</p>
    <ul>
      <li><a href="/guias/mesas-comandas">🪑 Mesas e Comandas</a></li>
      <li><a href="/guias/painel-cozinha">👨‍🍳 Painel da Cozinha</a></li>
      <li><a href="/guias/pedidos">📦 Processar Pedidos</a></li>
      <li><a href="/guias/caixa">💵 Gestão de Caixa</a></li>
    </ul>

    <h2>10. FAQ Rápido</h2>

    <h3>P: Posso deletar um pedido depois de criar?</h3>
    <p>R: Sim, clique nele e selecione "Cancelar". Só gerentes podem cancelar vendas registradas.</p>

    <h3>P: E se a comanda fica aberta por muito tempo?</h3>
    <p>R: Sem problema! Fica aberta até você fechar manualmente.</p>

    <h3>P: Posso transferir uma comanda de mesa?</h3>
    <p>R: Sim! Abra a comanda → "Transferir para outra mesa" → Escolha a mesa → Confirmar.</p>

    <h3>P: Se cair a internet, perco os dados?</h3>
    <p>R: Não! O sistema salva automaticamente e sincroniza quando voltar online.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b; font-style: italic;">
      ✨ Parabéns! Você já sabe o essencial para operar o TAVOLO. Bom trabalho! 🍽️
    </p>
  `,
}
