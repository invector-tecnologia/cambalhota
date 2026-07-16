export default {
  titulo: '👥 Cadastro de Usuários',
  conteudo: `
    <h1>Cadastro de Usuários e Permissões</h1>

    <p>Aprenda a criar, editar e gerenciar usuários do sistema com suas respectivas permissões.</p>

    <h2>1. Acessando Gestão de Usuários</h2>

    <p><strong>Apenas Admin e Gerente podem gerenciar usuários.</strong></p>

    <ol>
      <li>Vá para <strong>"Admin"</strong> no menu</li>
      <li>Clique em <strong>"Usuários"</strong></li>
      <li>Veja lista de todos os usuários</li>
    </ol>

    <h2>2. Criando um Novo Usuário</h2>

    <ol>
      <li>Clique em <strong>"Novo Usuário"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Nome:</strong> Ex: "João da Silva"</li>
          <li><strong>Email:</strong> Ex: "joao@restaurante.com"</li>
          <li><strong>Telefone:</strong> Opcional, para contato</li>
          <li><strong>Papel/Rol:</strong> Garçom, Gerente, Admin</li>
          <li><strong>Status:</strong> Ativo ou Inativo</li>
        </ul>
      </li>
      <li>Uma senha temporária é gerada e enviada por email</li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h3>Primeira Senha</h3>
    <p>O usuário receberá um email com:</p>
    <ul>
      <li>Link para acessar o TAVOLO</li>
      <li>Senha temporária</li>
      <li>Instruções para criar sua própria senha</li>
    </ul>

    <h2>3. Definindo Papéis (Roles)</h2>

    <h3>👔 Papel = Grupo de Permissões</h3>

    <table>
      <tr>
        <th>Papel</th>
        <th>Permissões</th>
        <th>Ideal Para</th>
      </tr>
      <tr>
        <td><strong>👔 Garçom</strong></td>
        <td>
          ✅ Ver cardápio<br>
          ✅ Criar pedidos<br>
          ✅ Fechar comandas<br>
          ❌ Ver caixa<br>
          ❌ Editar usuários
        </td>
        <td>Pessoal de atendimento</td>
      </tr>
      <tr>
        <td><strong>📊 Gerente</strong></td>
        <td>
          ✅ Tudo de Garçom<br>
          ✅ Abrir/Fechar caixa<br>
          ✅ Ver relatórios<br>
          ✅ Cancelar vendas<br>
          ✅ Descontos ilimitados<br>
          ❌ Editar cardápio<br>
          ❌ Deletar usuários
        </td>
        <td>Gerente do turno</td>
      </tr>
      <tr>
        <td><strong>👨‍💼 Admin</strong></td>
        <td>
          ✅ Tudo!<br>
          ✅ Editar cardápio<br>
          ✅ Gerenciar usuários<br>
          ✅ Ver logs de auditoria
        </td>
        <td>Dono ou supervisor</td>
      </tr>
    </table>

    <h2>4. Editando Usuário</h2>

    <ol>
      <li>Clique no usuário na lista</li>
      <li>Clique em <strong>"Editar"</strong></li>
      <li>Modifique:
        <ul>
          <li>Nome, email, telefone</li>
          <li>Papel (ex: Garçom → Gerente)</li>
          <li>Status (Ativo → Inativo)</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h2>5. Desativando Usuário</h2>

    <p><strong>Cenário:</strong> Funcionário saiu, férias, demissão.</p>

    <ol>
      <li>Abra o usuário</li>
      <li>Mude <strong>"Status"</strong> para <strong>"Inativo"</strong></li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <p><strong>Resultado:</strong></p>
    <ul>
      <li>✅ Não consegue fazer login</li>
      <li>✅ Dados históricos preservados</li>
      <li>✅ Pode reativar depois se necessário</li>
    </ul>

    <h2>6. Permissões Granulares</h2>

    <p><strong>Avançado:</strong> Você pode customizar permissões além do papel padrão.</p>

    <h3>Limite de Desconto</h3>
    <ol>
      <li>Edite o usuário garçom</li>
      <li>Configure <strong>"Limite de Desconto"</strong>: 10%</li>
      <li>Salve</li>
    </ol>

    <p>Esse garçom só pode dar até 10% de desconto. Acima disso, precisa gerente.</p>

    <h3>Acesso a Módulos</h3>
    <p>Você pode permitir/bloquear acesso a:</p>
    <ul>
      <li>📦 Estoque</li>
      <li>💰 Caixa</li>
      <li>📊 Relatórios</li>
      <li>👥 Usuários</li>
    </ul>

    <h2>7. Redefinir Senha</h2>

    <p><strong>Cenário:</strong> Usuário esqueceu a senha.</p>

    <ol>
      <li>Abra o usuário</li>
      <li>Clique em <strong>"Redefinir Senha"</strong></li>
      <li>Uma nova senha temporária é gerada</li>
      <li>Email é enviado ao usuário</li>
    </ol>

    <h2>8. Deletando Usuário</h2>

    <p><strong>⚠️ Cuidado:</strong> Isso deleta <strong>permanentemente</strong> o usuário e seus dados.</p>

    <ol>
      <li>Abra o usuário</li>
      <li>Clique em <strong>"Deletar"</strong> (geralmente no rodapé)</li>
      <li>Confirme a ação</li>
    </ol>

    <blockquote>
      <strong>Dica:</strong> Prefira <strong>Inativar</strong> a Deletar. Assim você mantém histórico!
    </blockquote>

    <h2>9. Log de Atividades (Auditoria)</h2>

    <p><strong>Admin only:</strong> Ver o que cada usuário fez.</p>

    <ol>
      <li>Vá para <strong>"Admin"</strong> → <strong>"Logs"</strong></li>
      <li>Veja:
        <ul>
          <li>Quem fez ação</li>
          <li>Qual ação (criou, editou, deletou)</li>
          <li>Quando foi</li>
          <li>Tabela afetada</li>
        </ul>
      </li>
    </ol>

    <p>Útil para rastrear quem mudou dados importantes.</p>

    <h2>10. Boas Práticas</h2>

    <h3>🔐 Segurança</h3>
    <ul>
      <li>Email único para cada usuário</li>
      <li>Senha forte (senha temporária é obrigatória)</li>
      <li>Desative usuário assim que sai da empresa</li>
      <li>Revise logs regularmente</li>
    </ul>

    <h3>👥 Organização</h3>
    <ul>
      <li>Mantenha nomes claros ("João Garçom", não "jj123")</li>
      <li>Documente quem é Admin e Gerente</li>
      <li>Tenha sempre 2+ Admin para emergências</li>
    </ul>

    <h2>11. Troubleshooting</h2>

    <h3>P: Usuário não consegue fazer login!</h3>
    <p>R: Verifique se está "Ativo". Se sim, peça para usar "Esqueci senha" no login.</p>

    <h3>P: Garçom conseguiu dar desconto acima do limite!</h3>
    <p>R: Pode ser que seja gerente ou admin. Revise o papel do usuário.</p>

    <h3>P: Preciso transferir responsabilidade de admin!</h3>
    <p>R: Mude o papel do novo admin para "Admin", depois mude o seu para "Gerente".</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Uma equipe bem organizada funciona melhor! 👏
    </p>
  `,
}
