export default {
  titulo: '🪑 Mesas e Comandas',
  conteudo: `
    <h1>Mesas e Comandas - Gerenciar o Salão</h1>

    <p>Este guia detalha como gerenciar mesas e comandas no TAVOLO, desde a configuração até operações avançadas.</p>

    <h2>1. Diferença entre Mesas e Comandas</h2>

    <h3>Mesas (Localização Física)</h3>
    <p>Representam os locais onde os clientes se sentam. Exemplos:</p>
    <ul>
      <li>Mesa 1, Mesa 2, Mesa 3, ... Mesa 20</li>
      <li>Balcão</li>
      <li>Área Externa</li>
      <li>Saleta Privada</li>
    </ul>

    <h3>Comandas (Grupos de Pedidos)</h3>
    <p>Registram os pedidos e são o que você vai fechar no final. Uma mesa pode ter várias comandas:</p>
    <ul>
      <li>Mesa 1 pode ter Comanda #1001, #1002, #1003 abertas ao mesmo tempo</li>
      <li>Comanda #1001 = Pedidos do João Silva</li>
      <li>Comanda #1002 = Pedidos da Maria Santos</li>
      <li>Comanda #1003 = Pedidos do Paulo Souza</li>
    </ul>

    <h2>2. Criando e Gerenciando Mesas</h2>

    <h3>Criar Uma Mesa</h3>
    <ol>
      <li>Vá para <strong>"Mesas"</strong> no menu principal</li>
      <li>Clique em <strong>"Nova Mesa"</strong> (botão verde)</li>
      <li>Preencha os dados:
        <ul>
          <li><strong>Nome:</strong> Ex: "Mesa 5"</li>
          <li><strong>Localização:</strong> "Salão" ou escolha a área</li>
          <li><strong>Capacidade:</strong> Número de assentos (ex: 4)</li>
          <li><strong>Status:</strong> Ativo ou Inativo</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h3>Editar Uma Mesa</h3>
    <ol>
      <li>Vá para <strong>"Mesas"</strong></li>
      <li>Encontre a mesa que deseja editar</li>
      <li>Clique no ícone <strong>"Editar"</strong> (lápis)</li>
      <li>Modifique os dados desejados</li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h3>Inativar Uma Mesa</h3>
    <p>Para mesas que não existem mais ou em manutenção:</p>
    <ol>
      <li>Vá para <strong>"Mesas"</strong></li>
      <li>Clique na mesa que deseja inativar</li>
      <li>Mude o status para <strong>"Inativa"</strong></li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <blockquote>
      <strong>💡 Dica:</strong> Mesas inativas não aparecem na lista de mesas disponíveis, mas os dados históricos são preservados.
    </blockquote>

    <h2>3. Abrindo e Gerenciando Comandas</h2>

    <h3>Abrir Uma Comanda</h3>
    <ol>
      <li>Vá para <strong>"Mesas"</strong></li>
      <li>Clique na mesa desejada</li>
      <li>Clique em <strong>"Abrir Comanda"</strong></li>
      <li>Digite o <strong>Nome do Cliente</strong> (opcional mas recomendado)</li>
      <li>Clique em <strong>"Confirmar"</strong></li>
    </ol>

    <p>A comanda é criada automaticamente com um número único (ex: #10547).</p>

    <h3>Adicionar Pedidos à Comanda</h3>
    <ol>
      <li>Na comanda aberta, clique em <strong>"Adicionar Itens"</strong></li>
      <li>Escolha os itens do cardápio</li>
      <li>Selecione a quantidade para cada item</li>
      <li>Clique em <strong>"Adicionar ao Carrinho"</strong></li>
      <li>Finalize clicando em <strong>"Confirmar Pedidos"</strong></li>
    </ol>

    <p>Os itens aparecem no <strong>Painel da Cozinha</strong> automaticamente.</p>

    <h3>Ver Comanda Aberta</h3>
    <ol>
      <li>Clique na mesa que tem a comanda</li>
      <li>Você verá todas as comandas abertas naquela mesa</li>
      <li>Clique na comanda para ver seus detalhes</li>
    </ol>

    <h2>4. Status das Comandas</h2>

    <table>
      <tr>
        <th>Status</th>
        <th>Significado</th>
        <th>O que fazer</th>
      </tr>
      <tr>
        <td><strong>Aberta</strong></td>
        <td>Cliente ainda está no salão</td>
        <td>Pode adicionar mais pedidos</td>
      </tr>
      <tr>
        <td><strong>Aguardando Pagamento</strong></td>
        <td>Pedidos prontos, esperando cliente pagar</td>
        <td>Processar pagamento</td>
      </tr>
      <tr>
        <td><strong>Fechada</strong></td>
        <td>Comanda já foi paga</td>
        <td>Nada, registro guardado</td>
      </tr>
    </table>

    <h2>5. Transferindo Comandas Entre Mesas</h2>

    <p><strong>Cenário:</strong> Clientes mudam de mesa.</p>

    <ol>
      <li>Abra a comanda na mesa atual</li>
      <li>Clique em <strong>"Ações"</strong> → <strong>"Transferir para outra mesa"</strong></li>
      <li>Escolha a mesa de destino</li>
      <li>Clique em <strong>"Confirmar"</strong></li>
    </ol>

    <p>A comanda sairá da mesa atual e aparecerá na nova mesa com todos os pedidos intactos.</p>

    <h2>6. Dividindo Contas</h2>

    <p><strong>Cenário:</strong> Dois clientes querem pagar separadamente na mesma mesa.</p>

    <h3>Opção 1: Usar Múltiplas Comandas</h3>
    <p>Abra uma comanda para cada cliente desde o início. Cada um tem sua conta.</p>

    <h3>Opção 2: Dividir Depois</h3>
    <ol>
      <li>Abra a comanda com todos os itens</li>
      <li>Na hora de fechar, selecione <strong>"Dividir Conta"</strong></li>
      <li>Escolha qual cliente paga qual item</li>
      <li>Processe cada pagamento separadamente</li>
    </ol>

    <h2>7. Visualizando Mesas e Ocupação</h2>

    <h3>Dashboard de Mesas</h3>
    <p>Vá para <strong>"Mesas"</strong> para ver:</p>
    <ul>
      <li>✅ Quais mesas estão ocupadas (com comanda aberta)</li>
      <li>✅ Quantas pessoas estão em cada mesa</li>
      <li>✅ Qual cliente (se registrado)</li>
      <li>✅ Tempo que a mesa está ocupada</li>
      <li>✅ Valor total da comanda até agora</li>
    </ul>

    <h3>Filtros Disponíveis</h3>
    <ul>
      <li><strong>Por Status:</strong> Ocupadas, Livres, Todas</li>
      <li><strong>Por Localização:</strong> Salão, Área externa, etc.</li>
      <li><strong>Por Capacidade:</strong> 2 pessoas, 4 pessoas, etc.</li>
    </ul>

    <h2>8. Dicas Práticas</h2>

    <h3>💡 Mantendo Mesas Organizadas</h3>
    <ul>
      <li>Numere mesas de forma clara (Mesa 1, Mesa 2, etc.)</li>
      <li>Identifique as regiões (Salão, Área Externa, Sala Privada)</li>
      <li>Mantenha capacidades realistas (evita overbooking)</li>
    </ul>

    <h3>⏱️ Gerenciando Tempo de Ocupação</h3>
    <ul>
      <li>O sistema registra automaticamente o tempo que a mesa está aberta</li>
      <li>Use isso para monitorar mesa "preguiçosa" que demora a pagar</li>
    </ul>

    <h3>🔔 Alertas de Comanda Aberta</h3>
    <ul>
      <li>Se uma comanda fica aberta por muito tempo, o sistema sinaliza</li>
      <li>Ideal para não esquecer de clientes aguardando no salão</li>
    </ul>

    <h2>9. Relatório de Ocupação</h2>

    <p>Para ver o histórico de ocupação:</p>
    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Ocupação de Mesas"</strong></li>
      <li>Selecione o período desejado</li>
      <li>Clique em <strong>"Gerar Relatório"</strong></li>
    </ol>

    <p>Você verá:</p>
    <ul>
      <li>Taxa de ocupação média</li>
      <li>Mesa mais ocupada</li>
      <li>Tempo médio de permanência</li>
      <li>Receita por mesa</li>
    </ul>

    <h2>10. Troubleshooting</h2>

    <h3>P: A mesa não aparece mais na lista. O que aconteceu?</h3>
    <p>R: Provavelmente foi marcada como "Inativa". Vá para configurações de mesa e ative novamente.</p>

    <h3>P: Abri uma comanda por engano. Como desfaço?</h3>
    <p>R: Não se preocupe. Clique em "Cancelar Comanda" e ela será removida sem registrar vendas.</p>

    <h3>P: Posso ter mais de 20 mesas?</h3>
    <p>R: Sim! Não há limite. Adicione quantas mesas precisar.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Dominando mesas e comandas, você têm a base do TAVOLO sob controle! 🎉
    </p>
  `,
}
