# UX Report - Transição Entre Bancos (v1.0.1)

## Contexto
Com a introdução de múltiplas conexões, a arquitetura de informação da TUI do Cambalhota exige um refatoramento focado na clareza do contexto ativo (Origem vs. Destino).

## Modificações na Interface (Abas e Painéis)

1. **Header Fixo (Global):**
   - O canto superior esquerdo consolida a identidade visual com a logo Retrowave ASCII.
   - O canto superior direito deve servir como um "Status Bar", indicando quantidade de conexões cadastradas.

2. **Nova Aba "Conexões":**
   - **Visualização:** Uma tabela clara mostrando: Nome, Engine (PG, MySql, etc) e Host.
   - **Interação:** Formulários modais sobrepostos para inserção de novas credenciais, evitando a troca de telas abruptas.

3. **Fluxo na Aba "Backup":**
   - Antes de iniciar a extração, o usuário é obrigado a focalizar e confirmar o "Banco de Origem".
   - A quebra de fluxo com mensagens do tipo "Selecione uma Origem" previne extrações em bancos incorretos.

4. **Fluxo na Aba "Restore (Cruzado)":**
   - **Separação Cognitiva:** O painel será dividido. Lado esquerdo: "O quê?" (Seleção de Dump). Lado direito: "Para Onde?" (Seleção do Banco Destino).
   - Este formato "side-by-side" mapeia perfeitamente o modelo mental do restore cruzado.

5. **Tratamento de Erros:**
   - Em caso de falha de decriptação (AES) ou conexão rejeitada, modais de erro guiarão o usuário de volta à Aba Conexões para correção.
