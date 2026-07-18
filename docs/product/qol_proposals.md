# Cambalhota TUI - Quality of Life (QoL) & UX Proposals

## Visão Geral
Com a consolidação da v1.0.1 (painel estático, menu de abas, formulários modais flutuantes e barra de status), a fundação da interface retrowave (Nim + `tatui`) está sólida. O próximo passo estratégico para o Produto é elevar a experiência do usuário inspirando-se nas melhores práticas de TUIs modernas como `k9s`, `lazygit` e `lazydocker`. O foco é garantir produtividade, confiança operacional e feedback visual imediato para os usuários (desenvolvedores, administradores e operadores).

## Propostas de Funcionalidades e Comportamentos

### 1. Busca Fuzzy em Listas de Dumps (Inspiração: `k9s`, `lazygit`)
- **Descrição:** Na aba *Restore*, permitir que o usuário pressione `/` para abrir um prompt de busca. A lista de backups deve ser filtrada em tempo real (fuzzy matching) buscando por nome do dump, data ou tags do ambiente.
- **Impacto UI/UX:** Essencial para usuários que gerenciam múltiplos ambientes e dezenas de backups. Evita a navegação tediosa com setas e scroll, permitindo encontrar o arquivo correto quase instantaneamente.

### 2. Validação em Tempo Real e "Test Connection" (Inspiração: Formulários Web Modernos)
- **Descrição:** Nos modais flutuantes (SQLite, AES-256, etc), validar os inputs no momento da digitação (ex: validar se a porta é numérica). Além disso, incluir um atalho/botão `[ Test Connection ]` (ex: `ctrl+t`) que tenta estabelecer conexão com o banco *antes* de fechar o modal.
- **Impacto UI/UX:** Estabelece um "feedback loop" imediato. Previne que o usuário salve configurações quebradas e só descubra o erro ao tentar executar um comando de backup, minimizando frustrações e logs de erro enigmáticos.

### 3. Painel de Preview de Metadados Contextual (Inspiração: `lazydocker`)
- **Descrição:** Ao navegar na lista de backups na aba *Restore*, o painel *side-by-side* adjacente deve exibir de forma dinâmica os metadados do dump em foco: Tamanho do arquivo formatado (MB/GB), Data de criação legível, Banco de origem, Hash de integridade, e uma estimativa de tempo de restore.
- **Impacto UI/UX:** Traz segurança psicológica. Restaurar um banco é uma ação de alto impacto; ter os detalhes visíveis antes de confirmar aumenta a confiança na operação e evita acidentes de substituição indesejada de dados.

### 4. Indicadores de Progresso Reais (Inspiração: `htop`, `k9s`)
- **Descrição:** Substituir a mensagem estática de "Processando..." na barra inferior por barras de progresso reais (`[=====>    ] 50%`) ou spinners interativos de alta fluidez para processos em background.
- **Impacto UI/UX:** Tarefas de I/O em bancos podem ser demoradas. Indicadores dinâmicos provam ao usuário que o Cambalhota não "travou", fornecendo previsibilidade e melhorando a percepção de performance da TUI.

### 5. Hints de Atalhos Dinâmicos (Inspiração: `nano`, `lazygit`)
- **Descrição:** A barra inferior deve exibir os atalhos de teclado *específicos para o contexto atual*. Por exemplo, no menu: `<Tab> Mudar Aba | <q> Sair`. Dentro de um modal: `<Enter> Salvar | <Esc> Cancelar | <Ctrl+t> Testar`.
- **Impacto UI/UX:** Torna a aplicação "self-documenting". O usuário não precisa recorrer a uma documentação externa para descobrir atalhos, diminuindo drasticamente a curva de aprendizado.

### 6. Command Palette / Ações Rápidas (Inspiração: VS Code, Sublime)
- **Descrição:** Pressionar `:` ou `Ctrl+p` para abrir um input centralizado permitindo disparar comandos textuais (ex: `backup:all`, `config:edit`).
- **Impacto UI/UX:** Direcionado aos "power users", permite executar ações de fluxo de trabalho complexas baseadas em memória muscular, sem necessidade de navegar manualmente pelas abas da interface.

### 7. Histórico de Backups Restaurados (Demanda do Usuário)
- **Descrição:** Criar uma view ou painel que exiba uma trilha de auditoria/histórico de todos os backups que já foram restaurados, explicitando exatamente para **qual banco de dados** e **qual schema** eles foram injetados.
- **Impacto UI/UX:** Essencial para governança e rastreabilidade. Evita o "voo cego" permitindo saber rapidamente quando e onde uma versão específica de um dump foi aplicada.

### 8. Refatoração Visual da Lista de Conexões (Demanda do Usuário)
- **Descrição:** Reestruturar as linhas de listagem na aba de configurações. Ao invés de uma string crua, desenhar de forma altamente intuitiva e visualmente separada as propriedades: `Tipo de Banco (Engine: pg, mysql, etc)`, `Nome do Banco de Dados`, e `Schema do Banco`.
- **Impacto UI/UX:** Leitura instantânea do inventário de bancos. Pode-se utilizar cores ou ícones em ASCII para diferenciar visualmente uma conexão PostgreSQL de uma SQL Server ou SQLite, melhorando o escaneamento ocular.

### 9. Rastreabilidade de Dumps e Localização (Demanda do Usuário)
- **Descrição:** Melhorar a listagem dos arquivos de backup já existentes, deixando muito explícito **onde eles estão fisicamente armazenados** (ex: `[LOCAL]`, `[S3]`, `[GCS]`, diretório de disco).
- **Impacto UI/UX:** Evita confusão sobre de onde o dump está sendo lido, especialmente preparando o terreno para quando o Cambalhota suportar extrações multi-cloud.
