# ADR 0002: TUI Refactoring - Replacing Illwill with Tatuí

## Status
Proposed

## Date
2026-07-16

## Context
The Cambalhota project currently uses the `illwill` library to render the command-line interface (TUI). `illwill` works with an "immediate mode" model, in which terminal buffers are drawn directly through coordinates (X, Y). This makes it hard to keep a responsive, componentized and easy-to-maintain layout, especially as the complexity of the Migration Engine tool grows.

To remove these limitations, the replacement of the `illwill` library by the `tatui` library (a proprietary solution inspired by `ratatui` from the Rust ecosystem) was requested. It introduces flexible layouts, declarative widgets and constraint-based rendering.

## Decision

The rewrite of the `src/main.nim` file and of the presentation logic will map the current `illwill` calls to the `tatui` widget paradigm.

### 1. Initialization and Main Loop
Instead of using `illwillInit`, `hideCursor` and managing a `TerminalBuffer` manually, we will use the `tatui` `Backend` and `Terminal` abstractions:

```nim
import tatui

var term = newTerminal(newAnsiBackend())
term.setup()
defer: term.restore()
```

### 2. Layout Management (Grid)
Manual coordinate calculations (`histX`, `histY`, `viewW`, etc.) will be replaced by the declarative layout system (Constraint Solver) based on `split`:

```nim
term.draw proc(f: var Frame) =
  # Vertical split (Header, Body, Footer)
  let vChunks = f.area.split(Vertical, @[length(1), fill(1), length(3)])
  let headerRect = vChunks[0]
  let bodyRect = vChunks[1]
  let statusRect = vChunks[2]

  # Horizontal split in the Body (History and Viewer)
  let hChunks = bodyRect.split(Horizontal, @[pct(33), pct(67)])
  let histRect = hChunks[0]
  let viewRect = hChunks[1]
```

### 3. Widget Mapping

1. **Navigation Menu:**
   - **From:** Custom `drawMenu` iterating over an array and changing colors on screen.
   - **To:** The `tabs` widget, receiving the list of strings and the selected index, with automatic highlight styling.

2. **History / Actions Panel:**
   - **From:** `tb.drawRect` plus iteration over `files` to print the lines and highlight the selected one by changing background colors.
   - **To:** The `list` widget together with `ListState` (`renderStateful`). The panel gets a border with `initBlock(title = " HISTORY / ACTIONS ", borders = AllBorders)`. The selected item is kept in an `st: ListState` variable.

3. **Code Viewer:**
   - **From:** Reading the file and printing it line by line with wrapping control (manual truncation).
   - **To:** The `paragraph` widget wrapping the file text, which handles word wrap and layout automatically inside its block (`initBlock`).

4. **Status Panel:**
   - **From:** Printing a bottom rectangle with the string cut at `viewW`.
   - **To:** The `paragraph` widget with `initBlock` wrapping `statusMsg`.

### 4. User Input
- **From:** `getKey()`
- **To:** `pollEvent(100)`, with the key codes (`kcChar`, `kcEsc`, `kcLeft`, `kcRight`, `kcUp`, `kcDown`, `kcEnter`) obtained through the `evKey` event.

## Consequences

### Positive
- **Maintainability:** The UI code will no longer deal with complex coordinate calculations, reducing overlap bugs in resized terminals.
- **Responsiveness:** `tatui` adapts block sizes automatically with flexible resolutions (`fill`, `pct`).
- **Design Pattern:** Componentized views enable a state-focused model (`Model-View-Update`), isolating the interface from the migration execution logic.

### Challenges / Points of Attention
- The team's learning curve with the declarative `tatui` framework.
- Moving the "immediate" input logic (`Key`) to the `pollEvent` abstraction.
- Handling repaint events during long migration runs, since we no longer control the buffer directly without involving an asynchronous render structure.
