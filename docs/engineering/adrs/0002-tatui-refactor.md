# ADR 0002: Refatoração da TUI - Substituição do Illwill pelo Tatuí

## Status
Proposto

## Data
2026-07-16

## Contexto
Atualmente, o projeto Cambalhota utiliza a biblioteca `illwill` para renderizar a interface de linha de comando (TUI). O `illwill` funciona através de um modelo "immediate mode", no qual os buffers de terminal são desenhados diretamente via coordenadas (X, Y). Isso traz dificuldades para manter um layout responsivo, componentizado e de fácil manutenção, especialmente à medida que a complexidade da ferramenta de Migration Engine aumenta.

Para resolver essas limitações, foi solicitada a substituição da biblioteca `illwill` pela biblioteca `tatui` (uma solução proprietária inspirada no `ratatui` do ecossistema Rust), que introduz o conceito de layouts flexíveis, widgets declarativos e renderização baseada em constraints.

## Decisão

A reescrita do arquivo `src/main.nim` e da lógica de apresentação será feita mapeando as chamadas atuais do `illwill` para o paradigma de widgets do `tatui`.

### 1. Inicialização e Loop Principal
Em vez de usar `illwillInit`, `hideCursor` e gerenciar um `TerminalBuffer` manualmente, utilizaremos a abstração de `Backend` e `Terminal` do `tatui`:

```nim
import tatui

var term = newTerminal(newAnsiBackend())
term.setup()
defer: term.restore()
```

### 2. Gerenciamento de Layout (Grid)
Os cálculos manuais de coordenadas (`histX`, `histY`, `viewW`, etc.) serão substituídos pelo sistema de layout declarativo (Constraint Solver) baseado no `split`:

```nim
term.draw proc(f: var Frame) =
  # Divisão Vertical (Topo, Corpo, Rodapé)
  let vChunks = f.area.split(Vertical, @[length(1), fill(1), length(3)])
  let headerRect = vChunks[0]
  let bodyRect = vChunks[1]
  let statusRect = vChunks[2]

  # Divisão Horizontal no Corpo (Histórico e Visualizador)
  let hChunks = bodyRect.split(Horizontal, @[pct(33), pct(67)])
  let histRect = hChunks[0]
  let viewRect = hChunks[1]
```

### 3. Mapeamento de Widgets

1. **Menu de Navegação:**
   - **De:** `drawMenu` customizado iterando sobre um array e modificando cores na tela.
   - **Para:** Utilização do widget `tabs`, passando a lista de strings e o índice selecionado, com estilo de highlight automático.

2. **Painel de Histórico / Ações:**
   - **De:** `tb.drawRect` mais iteração em `files` para imprimir as linhas e destacar a selecionada alterando as cores de background.
   - **Para:** Widget `list` em conjunto com `ListState` (`renderStateful`). O painel recebe uma borda com `initBlock(title = " HISTORY / ACTIONS ", borders = AllBorders)`. O item selecionado é mantido em uma variável `st: ListState`.

3. **Visualizador de Código:**
   - **De:** Leitura de arquivo e impressão linha por linha com controle de quebra (truncamento manual).
   - **Para:** Widget `paragraph` englobando o texto do arquivo, que trata word wrap e layout automaticamente dentro do seu bloco (`initBlock`).

4. **Painel de Status:**
   - **De:** Impressão de retângulo inferior com a string cortada ao `viewW`.
   - **Para:** Widget `paragraph` com `initBlock` encapsulando a `statusMsg`.

### 4. Entradas do Usuário
- **De:** `getKey()`
- **Para:** `pollEvent(100)`. Com os códigos de teclas (`kcChar`, `kcEsc`, `kcLeft`, `kcRight`, `kcUp`, `kcDown`, `kcEnter`) sendo obtidos através do evento `evKey`.

## Consequências

### Positivas
- **Manutenibilidade:** O código de UI deixará de lidar com cálculos complexos de coordenadas, reduzindo bugs de sobreposição em terminais redimensionados.
- **Responsividade:** O `tatui` adapta os tamanhos de blocos automaticamente com as resoluções flexíveis (`fill`, `pct`).
- **Padrão de Projeto:** A componentização das views permite um modelo focado no estado (`Model-View-Update`), isolando a interface da lógica da execução de migrations.

### Desafios / Pontos de Atenção
- Curva de aprendizado da equipe no framework declarativo `tatui`.
- Transição da lógica "imediata" de entrada (`Key`) para a abstração de `pollEvent`.
- Tratar eventos de repintura durante execuções demoradas das migrations, uma vez que não controlamos mais o buffer diretamente sem envolver uma estrutura de render assíncrono.
