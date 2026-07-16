export default {
  titulo: '📊 Relatórios e Análises',
  conteudo: `
    <h1>Relatórios e Análises - Entender seu Negócio</h1>

    <p>Aprenda a gerar relatórios para entender a saúde financeira e operacional do seu restaurante.</p>

    <h2>1. Acessando Relatórios</h2>

    <ol>
      <li>Vá para <strong>"Relatórios"</strong> no menu</li>
      <li>Escolha o tipo de relatório</li>
      <li>Selecione período (hoje, semana, mês, customizado)</li>
      <li>Clique em <strong>"Gerar"</strong></li>
    </ol>

    <p>O relatório aparece em tela ou pode ser baixado como PDF.</p>

    <h2>2. Principais Relatórios</h2>

    <h3>📈 Dashboard de Vendas</h3>
    <p>Resumo rápido de hoje:</p>
    <ul>
      <li>Total de vendas</li>
      <li>Número de clientes</li>
      <li>Ticket médio</li>
      <li>Forma de pagamento mais usada</li>
    </ul>

    <h3>💰 Faturamento</h3>
    <p>Detalhado por dia/semana/mês:</p>
    <ul>
      <li>Total de entrada (dinheiro + cartão + PIX)</li>
      <li>Gráfico de crescimento</li>
      <li>Comparação com período anterior</li>
    </ul>

    <h3>🍽️ Produtos Mais Vendidos</h3>
    <p>Ranking dos 10 items mais vendidos:</p>
    <ul>
      <li>Quantidade vendida</li>
      <li>Receita gerada</li>
      <li>Margem de lucro</li>
    </ul>

    <h3>💸 Margem de Lucro</h3>
    <p>Quanto você está lucrando realmente:</p>
    <ul>
      <li>Total de vendas</li>
      <li>Total de custo (insumos usados)</li>
      <li>Lucro = Vendas - Custo</li>
      <li>Margem % = (Lucro / Vendas) × 100</li>
    </ul>

    <h3>👥 Clientes</h3>
    <p>Análise de clientes:</p>
    <ul>
      <li>Top 10 clientes (maior gasto)</li>
      <li>Cliente novo vs. repetido</li>
      <li>Frequência média</li>
    </ul>

    <h3>🪑 Ocupação de Mesas</h3>
    <p>Estatísticas de ocupação:</p>
    <ul>
      <li>Taxa de ocupação (% de tempo com cliente)</li>
      <li>Tempo médio por mesa</li>
      <li>Mesa mais ocupada</li>
    </ul>

    <h3>⏱️ Tempo de Atendimento</h3>
    <p>Eficiência operacional:</p>
    <ul>
      <li>Tempo médio de preparação de pedido</li>
      <li>Tempo de permanência do cliente</li>
      <li>Pico de pedidos (horário mais ocupado)</li>
    </ul>

    <h3>📦 Estoque</h3>
    <p>Saúde do inventário:</p>
    <ul>
      <li>Valor total em estoque</li>
      <li>Insumos em falta</li>
      <li>Insumos com excesso</li>
      <li>Rotação média</li>
    </ul>

    <h2>3. Filtrando Relatórios</h2>

    <h3>Por Período</h3>
    <ul>
      <li>🏠 <strong>Hoje:</strong> Apenas hoje</li>
      <li>📅 <strong>Semana:</strong> Últimos 7 dias</li>
      <li>📆 <strong>Mês:</strong> Mês atual</li>
      <li>📋 <strong>Customizado:</strong> Datas específicas</li>
    </ul>

    <h3>Por Categoria</h3>
    <p>(Para relatório de produtos)</p>
    <ul>
      <li>Entradas</li>
      <li>Pratos Principais</li>
      <li>Bebidas</li>
      <li>Etc.</li>
    </ul>

    <h3>Por Forma de Pagamento</h3>
    <ul>
      <li>Dinheiro</li>
      <li>Cartão</li>
      <li>PIX</li>
    </ul>

    <h2>4. Comparando Períodos</h2>

    <p>Para ver crescimento/queda:</p>
    <ol>
      <li>Gere relatório do mês atual</li>
      <li>Anote o total (ex: R$ 15.000)</li>
      <li>Gere relatório do mês passado</li>
      <li>Compare
        <ul>
          <li>Crescimento % = ((Atual - Anterior) / Anterior) × 100</li>
        </ul>
      </li>
    </ol>

    <h3>Exemplo</h3>
    <ul>
      <li><strong>Janeiro:</strong> R$ 15.000</li>
      <li><strong>Fevereiro:</strong> R$ 16.500</li>
      <li><strong>Crescimento:</strong> (16.500 - 15.000) / 15.000 × 100 = 10%</li>
    </ul>

    <h2>5. Gráficos e Visualizações</h2>

    <h3>Tipos de Gráficos</h3>
    <ul>
      <li>📊 <strong>Barras:</strong> Vendas por dia</li>
      <li>📈 <strong>Linhas:</strong> Tendência ao longo do tempo</li>
      <li>🥧 <strong>Pizza:</strong> Distribuição (ex: % por forma pagamento)</li>
      <li>📋 <strong>Tabelas:</strong> Dados detalhados</li>
    </ul>

    <h2>6. Exportando Relatórios</h2>

    <h3>Para PDF</h3>
    <ol>
      <li>Gere o relatório</li>
      <li>Clique em <strong>"Baixar PDF"</strong></li>
      <li>Arquivo salvo no seu computador</li>
      <li>Pode imprimir, enviar por email, etc.</li>
    </ol>

    <h3>Para Excel</h3>
    <ol>
      <li>Clique em <strong>"Exportar CSV"</strong> ou <strong>"Excel"</strong></li>
      <li>Abre no Excel para análises mais profundas</li>
    </ol>

    <h2>7. Análises Importantes para Gerentes</h2>

    <h3>Rentabilidade</h3>
    <p>A pergunta: <strong>"Estou lucrando?"</strong></p>
    <ul>
      <li>Veja margem de lucro mês a mês</li>
      <li>Se < 30% → preços podem estar baixos ou custos altos</li>
    </ul>

    <h3>Produtos Problemáticos</h3>
    <p>Items que não vendem ou custam muito:</p>
    <ul>
      <li>Veja ranking inverso (menor venda)</li>
      <li>Considere tirar do cardápio ou rever preço</li>
    </ul>

    <h3>Horários Picos</h3>
    <p>Quando tem mais movimento:</p>
    <ul>
      <li>Almoço? Jantar? Fins de semana?</li>
      <li>Use para escalar equipe no horário certo</li>
    </ul>

    <h2>8. Metas e KPIs</h2>

    <h3>O que é KPI?</h3>
    <p><strong>Key Performance Indicator</strong> = métrica importante para seu negócio.</p>

    <h3>KPIs Comuns para Restaurante</h3>
    <ul>
      <li>📊 <strong>Ticket Médio:</strong> Média de gasto por cliente</li>
      <li>👥 <strong>Clientes por Dia:</strong> Quantos atendimentos</li>
      <li>📈 <strong>Crescimento:</strong> % mês a mês</li>
      <li>💰 <strong>Margem:</strong> % de lucro</li>
      <li>⏱️ <strong>Tempo médio:</strong> Quanto cliente fica na mesa</li>
    </ul>

    <h2>9. Dicas para Usar Dados</h2>

    <h3>📊 Tomando Decisões</h3>
    <ul>
      <li>Se prato X vende pouco → remova do cardápio</li>
      <li>Se sua margem cai → revise custos de insumos</li>
      <li>Se clientes caem → revise preços ou qualidade</li>
    </ul>

    <h3>🎯 Definindo Metas</h3>
    <ul>
      <li>Meta mensal: "Vender R$ 20.000"</li>
      <li>Meta diária: "Atender 50 clientes"</li>
      <li>Meta de margem: "Manter 40% de lucro"</li>
    </ul>

    <h2>10. Troubleshooting</h2>

    <h3>P: Um relatório parece errado!</h3>
    <p>R: Verifique o período e filtros selecionados. Se dúvida persista, consulte gerente.</p>

    <h3>P: Que período devo analisar?</h3>
    <p>R: Dica: sempre compare com mesmo período passado (semana com semana).</p>

    <h3>P: Posso salvar um relatório?</h3>
    <p>R: Sim! Baixe como PDF ou Excel e guarde. Sistema também mantém histórico.</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Dados bem analisados levam a negócios mais lucrativos! 📈
    </p>
  `,
}
