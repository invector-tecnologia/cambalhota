export default {
  titulo: '❓ FAQ - Perguntas Frequentes',
  conteudo: `
    <h1>FAQ - Perguntas Frequentes</h1>

    <p>Respostas rápidas às dúvidas mais comuns sobre o TAVOLO.</p>

    <h2>🔍 Buscando por Tópico?</h2>

    <h3>Geral</h3>
    <ul>
      <li><a href="#o-que-e-tavolo">O que é TAVOLO?</a></li>
      <li><a href="#como-fazer-login">Como fazer login?</a></li>
      <li><a href="#sistema-caiu">E se o sistema cair?</a></li>
    </ul>

    <h3>Operacional</h3>
    <ul>
      <li><a href="#diferenca-mesa-comanda">Qual é a diferença entre mesa e comanda?</a></li>
      <li><a href="#transferir-comanda">Como transferir uma comanda?</a></li>
      <li><a href="#cancelar-pedido">Como cancelar um pedido?</a></li>
    </ul>

    <h3>Financeiro</h3>
    <ul>
      <li><a href="#aplicar-desconto">Como aplicar desconto?</a></li>
      <li><a href="#fechamento-nao-bate">Por que o caixa não bate?</a></li>
      <li><a href="#formas-pagamento">Quais formas de pagamento existem?</a></li>
    </ul>

    <h3>Estoque</h3>
    <ul>
      <li><a href="#importar-xml">Como importar nota fiscal em XML?</a></li>
      <li><a href="#estoque-negativo">Como fico com estoque negativo?</a></li>
    </ul>

    <h2>Geral</h2>

    <h3 id="o-que-e-tavolo">P: O que é TAVOLO?</h3>
    <p>R: Um sistema ERP (Enterprise Resource Planning) completo para restaurantes, que gerencia mesas, comandas, pedidos, estoque, caixa e relatórios em um único lugar.</p>

    <h3 id="como-fazer-login">P: Como fazer login?</h3>
    <p>R: Acesse a URL, digite seu email e senha, clique "Entrar". Se esqueceu a senha, clique em "Esqueci senha" na tela de login.</p>

    <h3 id="sistema-caiu">P: E se o sistema cair ou perder internet?</h3>
    <p>R: O TAVOLO salva dados automaticamente. Se cair, seus dados estão seguros. Quando voltar online, tudo sincroniza automaticamente.</p>

    <h3>P: Posso usar no celular? (Tablet)</h3>
    <p>R: Sim! O sistema é responsivo e funciona perfeitamente em tablets. Ideal para garçoms tomarem pedidos circulando.</p>

    <h3>P: O TAVOLO tem backup?</h3>
    <p>R: Sim, automático! Seus dados são replicados em múltiplos servidores. Você também pode fazer backup manual.</p>

    <h2>Operacional</h2>

    <h3 id="diferenca-mesa-comanda">P: Qual é a diferença entre mesa e comanda?</h3>
    <p>R:</p>
    <ul>
      <li><strong>Mesa:</strong> Local físico do restaurante (Mesa 1, Mesa 2)</li>
      <li><strong>Comanda:</strong> Um registro de pedidos. Uma mesa pode ter várias comandas abertas</li>
    </ul>
    <p>Exemplo: Mesa 1 tem João (Comanda #1001) e Maria (Comanda #1002) ao mesmo tempo.</p>

    <h3 id="transferir-comanda">P: Como transferir uma comanda de uma mesa para outra?</h3>
    <p>R:</p>
    <ol>
      <li>Abra a comanda</li>
      <li>Clique em <strong>"Transferir para outra mesa"</strong></li>
      <li>Escolha a nova mesa</li>
      <li>Confirme</li>
    </ol>
    <p>A comanda se move com todos os pedidos intactos.</p>

    <h3 id="cancelar-pedido">P: Como cancelo um pedido?</h3>
    <p>R:</p>
    <ul>
      <li><strong>Antes de começar:</strong> Garçom pode cancelar</li>
      <li><strong>Depois de começar:</strong> Só gerente pode cancelar</li>
      <li>O item é removido da comanda e o valor é abatido</li>
    </ul>

    <h3>P: Um cliente quer dividir a conta em 3!</h3>
    <p>R: Você pode:</p>
    <ul>
      <li><strong>Opção 1:</strong> Criar 3 comandas desde o início (1 por pessoa)</li>
      <li><strong>Opção 2:</strong> Fechar a comanda e dividir manualmente com calculadora</li>
      <li><strong>Opção 3:</strong> Usar recursos de "Dividir Conta" no TAVOLO (se disponível)</li>
    </ul>

    <h3>P: Quanto tempo uma comanda pode ficar aberta?</h3>
    <p>R: Indefinidamente! Fica aberta até você fechá-la manualmente. Ideal para clientes que comem a noite toda.</p>

    <h3>P: Posso agendar um pedido para depois?</h3>
    <p>R: Sim! Ao criar a comanda, escolha "Agendar pedido para" e selecione o horário desejado.</p>

    <h2>Financeiro</h2>

    <h3 id="aplicar-desconto">P: Como aplicar desconto?</h3>
    <p>R:</p>
    <ol>
      <li>Na comanda aberta, procure por <strong>"Adicionar Desconto"</strong></li>
      <li>Escolha percentual (10%) ou valor (R$ 20)</li>
      <li>Coloque o motivo (Cortesia, Promoção, etc.)</li>
      <li>Clique <strong>"Aplicar"</strong></li>
    </ol>

    <h3 id="fechamento-nao-bate">P: Por que meu caixa não bate no fechamento?</h3>
    <p>R: Pode ser:</p>
    <ul>
      <li>❌ Engano ao contar dinheiro (recontagem)</li>
      <li>❌ Despesa que não registrou</li>
      <li>❌ Venda que não apareceu (verifique todas as comandas fechadas)</li>
      <li>❌ Troco errado dado a cliente</li>
    </ul>
    <p>O TAVOLO registra qualquer diferença para análise.</p>

    <h3 id="formas-pagamento">P: Quais formas de pagamento existem?</h3>
    <p>R:</p>
    <ul>
      <li>💵 Dinheiro</li>
      <li>💳 Cartão (débito e crédito)</li>
      <li>📱 PIX</li>
      <li>Outros (cheque, vale, etc.) se configurado</li>
    </ul>

    <h3>P: Pode registrar mais de uma forma de pagamento numa comanda?</h3>
    <p>R: Sim! Cliente paga parte em dinheiro, parte em cartão. Você registra cada parte separadamente.</p>

    <h3>P: Como funciona a taxa de serviço?</h3>
    <p>R: É uma percentagem cobrada pelo serviço (ex: 10%). É <strong>adicionada</strong> ao valor final, não desconto.</p>
    <ul>
      <li>Subtotal: R$ 100</li>
      <li>Taxa 10%: R$ 10</li>
      <li>Total: R$ 110</li>
    </ul>

    <h3>P: Posso cancelar uma venda já fechada?</h3>
    <p>R: Sim, mas <strong>só gerente</strong> pode. Vai para a seção de vendas, seleciona a venda, clica "Cancelar Venda".</p>

    <h2>Estoque</h2>

    <h3 id="importar-xml">P: Como importo uma nota fiscal em XML?</h3>
    <p>R:</p>
    <ol>
      <li>Vá para <strong>"Estoque"</strong> → <strong>"Notas Fiscais"</strong></li>
      <li>Clique <strong>"Importar XML"</strong></li>
      <li>Selecione o arquivo .xml do seu computador</li>
      <li>O TAVOLO extrai automaticamente os itens</li>
      <li>Confirme e o estoque é atualizado</li>
    </ol>

    <h3 id="estoque-negativo">P: Meu estoque ficou negativo! Como isso aconteceu?</h3>
    <p>R: Você vendeu mais do que tinha em estoque. Dicas para evitar:</p>
    <ul>
      <li>Configure alertas de mínimo</li>
      <li>Faça inventário regular (semanal)</li>
      <li>Se negar, faça ajuste manual via "Adicionar Estoque"</li>
    </ul>

    <h3>P: Quanto de insumo cada prato usa?</h3>
    <p>R: Verifique na <strong>"Receita"</strong> do produto. Lá você define que 1 Moqueca = 0.5kg de frango, por exemplo.</p>

    <h3>P: Meus custos parecem errados!</h3>
    <p>R: Pode ser:</p>
    <ul>
      <li>❌ Preço unitário do insumo desatualizado</li>
      <li>❌ Receita do produto errada (ingredientes faltam)</li>
      <li>❌ Estoque inicial estava errado</li>
      <li>❌ Desperdícios altos não registrados</li>
    </ul>

    <h2>Cardápio</h2>

    <h3>P: Como oculto um produto momentaneamente?</h3>
    <p>R: Marque como <strong>"Indisponível"</strong>. Garçom verá como 🚫 Indisponível na lista e não consegue vender.</p>

    <h3>P: Posso duplicar um produto?</h3>
    <p>R: Sim! Abra o produto → <strong>"Ações"</strong> → <strong>"Duplicar"</strong> → Edite nome/preço.</p>

    <h3>P: Mudei o preço mas garçom ainda vê o antigo!</h3>
    <p>R: Peça para o garçom <strong>recarregar a página</strong> (F5) ou fazer logout/login novamente.</p>

    <h2>Usuários</h2>

    <h3>P: Esqueci minha senha!</h3>
    <p>R:</p>
    <ol>
      <li>Na tela de login, clique <strong>"Esqueci senha"</strong></li>
      <li>Digite seu email</li>
      <li>Você receberá link para resetar</li>
      <li>Crie uma nova senha</li>
    </ol>

    <h3>P: Por que garçom não consegue fazer desconto grande?</h3>
    <p>R: Gerente configurou um <strong>"Limite de Desconto"</strong> (ex: máximo 10%). Acima disso, precisa de gerente/admin.</p>

    <h3>P: Um funcionário saiu. O que faço?</h3>
    <p>R: <strong>NÃO delete!</strong> Marque como <strong>"Inativo"</strong>. Assim preserva histórico e pode reativar se voltar.</p>

    <h2>Relatórios</h2>

    <h3>P: Qual período devo analisar?</h3>
    <p>R: Sempre compare com <strong>mesmo período anterior</strong>. Ex: semana com semana, mês com mês. Facilita comparação justa.</p>

    <h3>P: Posso exportar relatório?</h3>
    <p>R: Sim! Gere o relatório e clique <strong>"Baixar PDF"</strong> ou <strong>"Exportar Excel"</strong>.</p>

    <h3>P: Qual é meu principal KPI?</h3>
    <p>R: Depende do seu objetivo:</p>
    <ul>
      <li>🎯 <strong>Crescimento:</strong> Ticket médio, clientes por dia</li>
      <li>💰 <strong>Lucro:</strong> Margem %, receita</li>
      <li>⚡ <strong>Eficiência:</strong> Tempo de preparo, ocupação de mesas</li>
    </ul>

    <h2>🆘 Precisa de Mais Ajuda?</h2>

    <p>Se sua dúvida não foi respondida:</p>
    <ul>
      <li>📕 Consulte os <a href="/guias">outros guias</a></li>
      <li>🔍 Use a busca (Ctrl+F) nesta página</li>
      <li>💬 Contate o suporte (seu gerente/admin)</li>
    </ul>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Não encontrou? Talvez a resposta esteja em um dos outros guias! 🔍
    </p>
  `,
}
