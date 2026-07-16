export default {
  titulo: '🍽️ Gerenciar Cardápio',
  conteudo: `
    <h1>Gerenciar Cardápio</h1>

    <p>Neste guia você aprenderá como criar e manter seu cardápio atualizado no TAVOLO, incluindo produtos, categorias, receitas e preços.</p>

    <h2>1. Estrutura do Cardápio</h2>

    <h3>Categorias</h3>
    <p>Grupos que organizam os produtos. Exemplos:</p>
    <ul>
      <li>Entradas</li>
      <li>Pratos Principais</li>
      <li>Acompanhamentos</li>
      <li>Sobremesas</li>
      <li>Bebidas Alcoólicas</li>
      <li>Bebidas Não Alcoólicas</li>
    </ul>

    <h3>Produtos</h3>
    <p>Os itens que você vende. Cada produto pertence a uma categoria.</p>

    <h3>Receitas</h3>
    <p>Lista de ingredientes e quantidades usadas em cada produto.</p>

    <h2>2. Criando Categorias</h2>

    <ol>
      <li>Vá para <strong>"Cardápio"</strong> no menu</li>
      <li>Clique em <strong>"Categorias"</strong></li>
      <li>Clique em <strong>"Nova Categoria"</strong></li>
      <li>Preencha:
        <ul>
          <li><strong>Nome:</strong> Ex: "Entradas"</li>
          <li><strong>Descrição:</strong> (Opcional) "Pratos para começar"</li>
          <li><strong>Ícone:</strong> Escolha uma imagem ou ícone</li>
          <li><strong>Ordem:</strong> Para organizar na exibição</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h2>3. Criando Produtos</h2>

    <ol>
      <li>Vá para <strong>"Cardápio"</strong> → <strong>"Produtos"</strong></li>
      <li>Clique em <strong>"Novo Produto"</strong></li>
      <li>Preencha os dados:
        <ul>
          <li><strong>Nome:</strong> Ex: "Moqueca de Camarão"</li>
          <li><strong>Categoria:</strong> Escolha a categoria apropriada</li>
          <li><strong>Descrição:</strong> Descreva o prato: "Tradicional moqueca baiana com leite de coco e azeite de dendê"</li>
          <li><strong>Preço:</strong> Ex: R$ 45,90</li>
          <li><strong>Custo:</strong> Quanto custa fazer (ingredientes)</li>
          <li><strong>Imagem:</strong> Upload foto do prato</li>
        </ul>
      </li>
      <li>Clique em <strong>"Salvar"</strong></li>
    </ol>

    <h2>4. Definindo Preços e Margens</h2>

    <h3>Cálculo de Margem</h3>
    <p>O sistema calcula automaticamente:</p>

    <blockquote>
      <strong>Margem % = ((Preço - Custo) / Preço) × 100</strong>
    </blockquote>

    <p>Exemplo:</p>
    <ul>
      <li><strong>Custo:</strong> R$ 15,00</li>
      <li><strong>Preço:</strong> R$ 45,00</li>
      <li><strong>Margem:</strong> (45 - 15) / 45 × 100 = 67%</li>
    </ul>

    <h3>Formação de Preços</h3>
    <p>Dicas para precificar:</p>
    <ul>
      <li><strong>Restaurante fino:</strong> Margem 60-70%</li>
      <li><strong>Restaurante casual:</strong> Margem 50-60%</li>
      <li><strong>Lanchonete:</strong> Margem 40-50%</li>
    </ul>

    <h2>5. Gerenciando Receitas</h2>

    <h3>O que é uma Receita no TAVOLO?</h3>
    <p>Uma receita lista os <strong>insumos</strong> (ingredientes do estoque) usados em cada produto, com quantidades.</p>

    <h3>Criando uma Receita</h3>
    <ol>
      <li>Abra um produto</li>
      <li>Clique na aba <strong>"Receita"</strong></li>
      <li>Clique em <strong>"Adicionar Ingrediente"</strong></li>
      <li>Escolha o insumo do estoque</li>
      <li>Digite a quantidade usada</li>
      <li>Clique em <strong>"Adicionar"</strong></li>
      <li>Repita para todos os ingredientes</li>
      <li>Clique em <strong>"Salvar Receita"</strong></li>
    </ol>

    <h3>Benefícios da Receita</h3>
    <ul>
      <li>✅ Calcula automaticamente o custo do prato</li>
      <li>✅ Controla quanto de estoque você tem</li>
      <li>✅ Avisa quando falta ingrediente</li>
      <li>✅ Otimiza a margem do restaurante</li>
    </ul>

    <h2>6. Upload de Imagens</h2>

    <h3>Fotos do Cardápio Virtual</h3>
    <p>Se você usa cardápio virtual para clientes, as imagens aparecem nele.</p>

    <ol>
      <li>Ao criar/editar um produto, procure por <strong>"Upload de Imagem"</strong></li>
      <li>Clique e escolha uma foto do seu computador</li>
      <li>A imagem é enviada automaticamente</li>
      <li>Clique <strong>"Salvar"</strong></li>
    </ol>

    <blockquote>
      <strong>Dica:</strong> Use fotos de boa qualidade! Foto boa vende mais! 📸
    </blockquote>

    <h2>7. Disponibilidade e Destaque</h2>

    <h3>Marcar como Indisponível</h3>
    <p>Se um prato acabou ou a cozinha não quer fazer:</p>
    <ol>
      <li>Abra o produto</li>
      <li>Clique em <strong>"Indisponível"</strong></li>
      <li>Garçons verão um <strong>"🚫 Indisponível"</strong> na lista</li>
    </ol>

    <h3>Destaque</h3>
    <p>Para promover um prato específico:</p>
    <ol>
      <li>Abra o produto</li>
      <li>Marque <strong>"Destaque"</strong> ou <strong>"Especial do Dia"</strong></li>
      <li>No cardápio dos garçons, aparecerá em destaque com ⭐</li>
    </ol>

    <h2>8. Cardápio Virtual</h2>

    <h3>O que é?</h3>
    <p>Uma versão online do seu cardápio que clientes podem ver no celular.</p>

    <h3>Ativando</h3>
    <ol>
      <li>Vá para <strong>"Configurações"</strong></li>
      <li>Procure por <strong>"Cardápio Virtual"</strong></li>
      <li>Marque <strong>"Ativo"</strong></li>
      <li>Compartilhe o link com clientes</li>
    </ol>

    <h3>O que aparece</h3>
    <ul>
      <li>Nome do produto</li>
      <li>Foto (se uploaded)</li>
      <li>Descrição</li>
      <li>Preço</li>
      <li>Disponibilidade</li>
    </ul>

    <h2>9. Organizando o Cardápio</h2>

    <h3>Ordem de Exibição</h3>
    <p>Você pode reordenar categorias e produtos:</p>
    <ol>
      <li>Vá para <strong>"Cardápio"</strong> → <strong>"Categorias"</strong></li>
      <li>Clique e arraste para reordenar</li>
      <li>A ordem aparece também nos pedidos</li>
    </ol>

    <h3>Filtros para Garçons</h3>
    <p>Os garçons veem o cardápio organizado por:</p>
    <ul>
      <li>Categoria</li>
      <li>Disponibilidade (mostra indisponíveis riscados)</li>
      <li>Favoritos (marcados com ⭐)</li>
    </ul>

    <h2>10. Relatório do Cardápio</h2>

    <p>Para analisar o desempenho dos produtos:</p>
    <ol>
      <li>Vá para <strong>"Relatórios"</strong></li>
      <li>Escolha <strong>"Produtos Mais Vendidos"</strong></li>
      <li>Veja ranking de vendas</li>
      <li>Analise margem de cada produto</li>
    </ol>

    <h2>11. Troubleshooting</h2>

    <h3>P: Mudei o preço mas garçons ainda veem o antigo!</h3>
    <p>R: Peça para o garçom recarregar a página do navegador ou faça logout e login novamente.</p>

    <h3>P: Posso duplicar um produto?</h3>
    <p>R: Sim! Abra o produto → Clique em "Ações" → "Duplicar" → Edite o nome/preço.</p>

    <h3>P: Como apago um produto?</h3>
    <p>R: Abra o produto → Clique em "Deletar" → Confirme. Cuidado: perderia histórico de vendas!</p>

    <hr style="border-top: 2px solid #e2e8f0; margin: 2rem 0;">

    <p style="text-align: center; color: #64748b;">
      Um bom cardápio organizado aumenta vendas! 📈
    </p>
  `,
}
