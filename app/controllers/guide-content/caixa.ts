export default {
  titulo: '💵 Gestão de Caixa',
  conteudo: `
    <h1>Gestão de Caixa - Controle de Dinheiro</h1>

    <p>Aprenda a abrir caixa no início do dia, registrar vendas e fechar o caixa no final do expediente.</p>

    <h2>1. Entendendo a Caixa</h2>

    <h3>O que é?</h3>
    <p>Um registro de todo dinheiro (e cartão/PIX) que entra e sai do seu restaurante.</p>

    <h3>Conceitos-Chave</h3>
    <ul>
      <li><strong>Saldo Inicial:</strong> Quanto você tinha de dinheiro no caixa no início</li>
      <li><strong>Entradas:</strong> Vendas do dia (dinheiro, cartão, PIX)</li>
      <li><strong>Saídas:</strong> Despesas (compras, suprimentos, etc.)</li>
      <li><strong>Saldo Final:</strong> Quanto você tem no final do dia</li>
    </ul>

    <h2>2. Abrindo o Caixa</h2>

    <h3>Início do Dia</h3>
    <ol>
      <li>Vá para <strong>"Caixa"</strong> no menu</li>
      <li>Clique em <strong>"Abrir Caixa"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Saldo Inicial:</strong> Quanto tem em dinheiro (ex: R$ 200,00)</li>
          <li><strong>Responsável:</strong> Seu nome (automático via login)</li>
          <li><strong>Data/Hora:</strong> Automático</li>
        </ul>
      </li>
      <li>Clique em <strong>"Confirmar"</strong></li>
    </ol>

    <p><strong>Pronto!</strong> Caixa está aberto e você pode começar a vender.</p>

    <h2>3. Registrando Vendas</h2>

    <h3>Automático</h3>
    <p>Quando você fecha uma comanda (paga), a venda é registrada <strong>automaticamente</strong> no caixa.</p>

    <h3>Verificando Vendas</h3>
    <ol>
      <li>Clique em <strong>"Ver Vendas do Dia"</strong></li>
      <li>Veja:
        <ul>
          <li>Total de vendas</li>
          <li>Por forma de pagamento</li>
          <li>Cada venda listada</li>
        </ul>
      </li>
    </ol>

    <h2>4. Formas de Pagamento</h2>

    <h3>Dinheiro</h3>
    <p>Cliente paga com notas e moedas. Registrado no caixa.</p>

    <h3>Cartão</h3>
    <p>Débito ou crédito. Aparece separado para conciliação com banco.</p>

    <h3>PIX</h3>
    <p>Pagamento via QR code. Registrado como eletrônico.</p>

    <h3>Registrando Pagamento</h3>
    <ol>
      <li>Na página de fechamento de comanda</li>
      <li>Escolha a forma de pagamento</li>
      <li>O TAVOLO coloca na categoria correta automaticamente</li>
      <li>Confirme</li>
    </ol>

    <h2>5. Fechando o Caixa</h2>

    <h3>Fim do Dia</h3>
    <ol>
      <li>Vá para <strong>"Caixa"</strong></li>
      <li>Clique em <strong>"Fechar Caixa"</strong></li>
      <li>O sistema mostra:
        <ul>
          <li><strong>Saldo Inicial:</strong> R$ 200,00</li>
          <li><strong>Total de Vendas:</strong> R$ 1.500,00</li>
          <li><strong>Saldo Esperado:</strong> R$ 1.700,00</li>
        </ul>
      </li>
      <li>Faça contagem física do caixa</li>
      <li>Preencha <strong>"Saldo Real"</strong>: Quanto efetivamente tem</li>
      <li>Clique em <strong>"Validar"</strong></li>
    </ol>

    <h3>Se os Valores não Batem</h3>
    <p>Se saldo esperado ≠ saldo real:</p>

    <blockquote>
      <strong>Diferença = Saldo Real - Saldo Esperado</strong>
    </blockquote>

    <p>Exemplo:</p>
    <ul>
      <li><strong>Esperado:</strong> R$ 1.700,00</li>
      <li><strong>Real:</strong> R$ 1.650,00</li>
      <li><strong>Falta:</strong> R$ 50,00 (perda ou erro)</li>
    </ul>

    <p>O TAVOLO registra essa diferença para auditoria.</p>

    <h2>6. Despesas (Saídas)</h2>

    <h3>Registrando Despesa</h3>
    <ol>
      <li>Com o caixa aberto, clique em <strong>"Adicionar Despesa"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Descrição:</strong> Ex: "Compra de pano de prato"</li>
          <li><strong>Valor:</strong> R$ 50,00</li>
          <li><strong>Categoria:</strong> Suprimentos, Manutenção, etc.</li>
        </ul>
      </li>
      <li>Clique em <strong>"Registrar"</strong></li>
    </ol>

    <p>A despesa é subtraída do saldo do caixa automaticamente.</p>

    <h2>7. Relatório de Caixa</h2>

    <p>Ver detalhes completos:</p>
    <ol>
      <li>Clique em <strong>"Relatório"</strong> na página de caixa</li>
      <li>Veja:
        <ul>
          <li>Resumo de entrada/saída</li>
          <li>Todos os pagamentos do dia</li>
          <li>Todas as despesas</li>
          <li>Diferença (se houver)</li>
        </ul>
      </li>
    </ol>

    <h2>8. Múltiplos Caixas</h2>

    <h3>Se Tem Vários Garçons/Caixas</h3>
    <p>Cada um pode ter seu caixa separado:</p>
    <ol>
      <li>Garçom A abre caixa dele</li>
      <li>Garçom B abre caixa dele</li>
      <li>Final do dia: cada um fecha seu caixa</li>
      <li>Gerente faz consolidado</li>
    </ol>

    <h2>9. Dicas Práticas</h2>

    <h3>⏰ Horário Constante</h3>
    <ul>
      <li>Sempre abra na mesma hora (ex: 11:00)</li>
      <li>Sempre feche na mesma hora (ex: 22:00)</li>
      <li>Facilita controle e rotina</li>
    </ul>

    <h3>🔍 Sanidade do Caixa</h3>
    <ul>
      <li>Se diferença > 5% → investigar</li>
      <li>Pode ser erro de digitação ou furto</li>
      <li>Registre e comunique ao gerente</li>
    </ul>

    <h3>💾 Backup</h3>
    <ul>
      <li>Sistema salva automaticamente</li>
      <li>Você pode baixar relatório em PDF</li>
    </ul>

    <h2>10. Troubleshooting</h2>

    <h3>P: Abri caixa mas não consigo fazer venda!</h3>
    <p>R: Caixa precisa estar aberto. Verifique se status mostra "ABERTO".</p>

    <h3>P: Posso ajustar saldo após fechar?</h3>
    <p>R: Sim. Como gerente, vá à caixa → "Editar" → "Ajustar Diferença".</p>

    <h3>P: Fiz despesa grande por engano!</h3>
    <p>R: Clique na despesa → "Desfazer" ou "Deletar" (só gerente).</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Um caixa bem fechado é um restaurante sob controle! 💪
    </p>
  `,
}
