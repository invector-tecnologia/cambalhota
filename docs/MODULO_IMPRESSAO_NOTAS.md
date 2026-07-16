# Modulo de configuracao e impressao de notas

## Rotas relacionadas

- UI: /admin/configuracoes/impressao
- UI: /financeiro/vendas/:id/imprimir

## Objetivo

Configurar logo e mensagem de rodape e imprimir a nota da venda.

## Como usar

1. Acesse /admin/configuracoes/impressao.
2. Envie logo (png/jpg/webp) e salve a mensagem de rodape.
3. Em /financeiro/vendas/:id use o botao de imprimir.

## Arquivos principais

- Controller: app/controllers/print_config_controller.ts
- View: resources/views/print-config/index.edge
- Template de impressao: resources/views/vendas/print.edge

## Observacoes

- A logo e armazenada no banco em formato binario.
- A impressao abre em nova aba para evitar perda de contexto.
    .select('logo_data', 'logo_mime_type', 'logo_filename')
    .firstOrFail()
  
  response.header('Content-Type', empresa.logoMimeType)
  return response.send(empresa.logoData)
}

```

### Nota Fiscal

- Largura: 80mm (padrão de impressoras térmicas)
- Altura: auto (ajusta ao conteúdo)
- Fonte: Courier New (monoespaçada, ideal para impressão térmica)
- Tamanho da fonte: 12px (corpo), 10px (detalhes)
- Margens: 5mm

## 🎨 Estilos e Layout

### Seções da Nota Fiscal

1. **Header**
   - Logo centralizada
   - Nome da empresa
   - Nome fantasia
   - CNPJ formatado
   - Endereço completo
   - Telefone e email

2. **Informações da Venda**
   - Número da venda
   - Data e hora
   - Atendente
   - Comanda/Mesa (se aplicável)

3. **Itens**
   - Nome do produto
   - Quantidade x Preço unitário
   - Subtotal
   - Observações do item

4. **Totalizadores**
   - Subtotal
   - Desconto (se houver)
   - Total final
   - Forma de pagamento
   - Observações da venda

5. **Rodapé**
   - Mensagem personalizada
   - Aviso fiscal
   - Data/hora de emissão
   - Website (se cadastrado)

## 📱 Responsividade

O sistema é responsivo e funciona em:

- Desktop (configuração e visualização)
- Tablet (configuração e visualização)
- Mobile (configuração, impressão pode ter limitações do dispositivo)

## 🔐 Segurança

- Apenas usuários autenticados podem acessar
- Cada empresa vê apenas suas próprias configurações
- Upload limitado a 5MB e formatos de imagem válidos
- Validação de tipos MIME

## 🚀 Próximos Passos Sugeridos

1. **Melhorias futuras possíveis:**
   - Configuração de tamanho de papel (58mm, 80mm)
   - Templates customizáveis
   - QR Code na nota fiscal
   - Integração com impressora térmica via driver
   - Histórico de impressões
   - Relatório de notas fiscais emitidas

2. **Testes recomendados:**
   - Testar impressão em impressora térmica real
   - Verificar compatibilidade com diferentes navegadores
   - Testar com diferentes tamanhos de logo
   - Validar com vendas de diferentes tamanhos

## 📝 Notas Importantes

- A logo é armazenada no banco de dados (BYTEA), não em arquivos
- Recomenda-se logo com fundo transparente (PNG)
- A mensagem de rodapé deve ser concisa
- O template é otimizado para impressoras térmicas de 80mm
- Não é uma nota fiscal eletrônica (NF-e), apenas um cupom de venda

## 🆘 Troubleshooting

**Logo não aparece:**

- Verifique se o arquivo foi enviado corretamente
- Confirme que o formato é suportado (PNG, JPG, JPEG, WEBP)
- Verifique o tamanho do arquivo (máx 5MB)

**Impressão cortada:**

- Ajuste as margens da impressora
- Verifique se está usando papel de 80mm
- Teste o driver da impressora

**Mensagem não aparece:**

- Confirme que salvou as configurações
- Recarregue a página de impressão
- Verifique no banco de dados se o campo foi atualizado
