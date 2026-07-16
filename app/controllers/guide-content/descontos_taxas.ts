export default {
  titulo: '💳 Descontos e Taxas',
  conteudo: `
    <h1>Descontos e Taxas</h1>

    <p>Neste guia você aprenderá como aplicar descontos e cobrar taxas (como taxa de serviço) na comanda.</p>

    <h2>1. Tipos de Descontos</h2>

    <h3>Desconto em Percentual (%)</h3>
    <p>Exemplo: 10% de desconto em toda a comanda.</p>

    <h3>Desconto em Valor (R$)</h3>
    <p>Exemplo: R$ 20,00 de desconto na comanda.</p>

    <h3>Desconto por Item</h3>
    <p>Desconto em um item específico (ex: cupom para 1 prato).</p>

    <h2>2. Aplicando Desconto</h2>

    <h3>Na Comanda Aberta</h3>
    <ol>
      <li>Abra a comanda</li>
      <li>Veja o <strong>"Resumo da Comanda"</strong></li>
      <li>Clique em <strong>"Adicionar Desconto"</strong></li>
      <li>Escolha:
        <ul>
          <li>Tipo: Percentual ou Valor</li>
          <li>Valor: 10% ou R$ 20,00</li>
          <li>Motivo: "Promoção", "Cortesia gerente", etc.</li>
        </ul>
      </li>
      <li>Clique em <strong>"Aplicar"</strong></li>
    </ol>

    <p>O desconto é subtraído do total imediatamente.</p>

    <h3>Por Item Específico</h3>
    <ol>
      <li>Na comanda, encontre o item</li>
      <li>Clique em <strong>"Editar Item"</strong> ou ícone de desconto</li>
      <li>Escolha:
        <ul>
          <li>Percentual: 10%</li>
          <li>Valor: R$ 5,00</li>
        </ul>
      </li>
      <li>Confirme</li>
    </ol>

    <h2>3. Removendo Desconto</h2>

    <ol>
      <li>Abra a comanda</li>
      <li>No resumo, clique no desconto aplicado</li>
      <li>Clique em <strong>"Remover"</strong> ou ajuste o valor</li>
      <li>Confirme</li>
    </ol>

    <h2>4. Taxa de Serviço</h2>

    <h3>O que é?</h3>
    <p>Uma percentagem adicional cobrada pelo serviço. Ex: 10% em grupos acima de 6 pessoas.</p>

    <h3>Como Funciona</h3>
    <ul>
      <li>Taxa de 10%: Se comanda tem R$ 100, taxa é R$ 10</li>
      <li>A taxa é <strong>adicionada</strong> ao valor final</li>
      <li>Cliente vê separadamente: "Subtotal: R$ 100 + Taxa: R$ 10 = Total: R$ 110"</li>
    </ul>

    <h3>Aplicando Taxa Manual</h3>
    <ol>
      <li>Abra a comanda</li>
      <li>Procure por <strong>"Taxa de Serviço"</strong> na seção de resumo</li>
      <li>Marque como <strong>"Aplicar"</strong> ou <strong>"Aplicar Automático"</strong></li>
      <li>Configure a percentagem (ex: 10%)</li>
      <li>Confirme</li>
    </ol>

    <h2>5. Taxa Automática</h2>

    <h3>Configurando Regras</h3>
    <p>Você pode configurar no TAVOLO para aplicar taxa automaticamente:</p>

    <ol>
      <li>Vá para <strong>"Configurações"</strong></li>
      <li>Procure por <strong>"Taxa de Serviço"</strong></li>
      <li>Defina:
        <ul>
          <li><strong>Percentual:</strong> Quanto cobrar (ex: 10%)</li>
          <li><strong>Condição:</strong> A partir de quantos clientes? (ex: 6 pessoas)</li>
          <li><strong>Aplicar automaticamente?</strong> Sim ou não</li>
        </ul>
      </li>
      <li>Salve</li>
    </ol>

    <h3>Exemplo de Configuração</h3>
    <ul>
      <li>Grupos de 1-3 pessoas: Sem taxa</li>
      <li>Grupos de 4-5 pessoas: Sem taxa</li>
      <li>Grupos de 6 pessoas: Taxa 10%</li>
      <li>Grupos de 10 ou mais: Taxa 15%</li>
    </ul>

    <h2>6. Cupons de Desconto</h2>

    <h3>Criando Cupom</h3>
    <ol>
      <li>Vá para <strong>"Configurações"</strong> → <strong>"Cupons"</strong></li>
      <li>Clique em <strong>"Novo Cupom"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Código:</strong> Ex: "PROMO10" ou "NEWCLIENT"</li>
          <li><strong>Desconto:</strong> 10% ou R$ 20,00</li>
          <li><strong>Válido até:</strong> Data de expiração</li>
          <li><strong>Máximo de usos:</strong> Ilimitado ou número</li>
        </ul>
      </li>
      <li>Salve</li>
    </ol>

    <h3>Usando Cupom</h3>
    <ol>
      <li>Na comanda, procure por <strong>"Usar Cupom"</strong></li>
      <li>Digite o código (ex: "PROMO10")</li>
      <li>Clique em <strong>"Aplicar"</strong></li>
      <li>Desconto aparece automaticamente</li>
    </ol>

    <h2>7. Combinando Desconto + Taxa</h2>

    <h3>Cenário Comum</h3>
    <p>Cliente tem cupom de desconto mas também há taxa de serviço.</p>

    <p><strong>Cálculo:</strong></p>
    <ul>
      <li>Subtotal: R$ 100,00</li>
      <li>Menos desconto (10%): -R$ 10,00</li>
      <li>Mais taxa (10%): +R$ 9,00 (sobre R$ 90)</li>
      <li>Total: R$ 99,00</li>
    </ul>

    <blockquote>
      <strong>O TAVOLO calcula automaticamente! Você não precisa fazer contas.</strong>
    </blockquote>

    <h2>8. Relatório de Descontos</h2>

    <p>Para auditar descontos dados:</p>
    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Descontos Concedidos"</strong></li>
      <li>Veja:
        <ul>
          <li>Total de descontos do dia</li>
          <li>Desconto maior</li>
          <li>Motivo mais comum</li>
        </ul>
      </li>
    </ol>

    <h2>9. Permissões</h2>

    <h3>Quem Pode Dar Desconto?</h3>

    <table>
      <tr>
        <th>Papel</th>
        <th>Pode Descontar?</th>
        <th>Limite</th>
      </tr>
      <tr>
        <td><strong>Garçom</strong></td>
        <td>Sim</td>
        <td>Até X% do gerente</td>
      </tr>
      <tr>
        <td><strong>Gerente</strong></td>
        <td>Sim</td>
        <td>Sem limite</td>
      </tr>
      <tr>
        <td><strong>Admin</strong></td>
        <td>Sim</td>
        <td>Sem limite</td>
      </tr>
    </table>

    <h3>Configurando Limite de Desconto para Garçom</h3>
    <ol>
      <li>Vá para <strong>"Admin"</strong> → <strong>"Usuários"</strong></li>
      <li>Edite o garçom</li>
      <li>Configure <strong>"Limite de Desconto"</strong>: Até 15% por comanda</li>
      <li>Salve</li>
    </ol>

    <p>Garçoms só poderão dar até esse desconto. Acima disso, precisa de gerente.</p>

    <h2>10. Dicas Práticas</h2>

    <h3>🎯 Usando Descontos Estrategicamente</h3>
    <ul>
      <li>Desconto para cliente frequente: Cria fidelização</li>
      <li>Desconto para prato que vence: Reduz desperdício</li>
      <li>Desconto para comanda grande: Incentiva consumo</li>
    </ul>

    <h3>📊 Monitorando Custos</h3>
    <ul>
      <li>Verifique relatório de descontos mensalmente</li>
      <li>Se crescer muito, revisite política de descontos</li>
    </ul>

    <h2>11. Troubleshooting</h2>

    <h3>P: Apliquei desconto mas não aparece no recibo!</h3>
    <p>R: Recarregue a página ou feche e reabra a comanda. Desconto já foi aplicado.</p>

    <h3>P: Cupom não funciona!</h3>
    <p>R: Pode ter expirado ou chegado ao limite de usos. Confira em "Configurações" → "Cupons".</p>

    <h3>P: Posso reverter um desconto?</h3>
    <p>R: Sim! Clique no desconto e escolha "Remover" ou "Editar".</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Use descontos inteligentemente para aumentar satisfação e fidelização! 💰
    </p>
  `,
}
