---
name: tailwind-frontend
description: >
  Padrões obrigatórios de implementação Frontend (Edge.js + Tailwind) para o tavolo.
  Ativar quando o agente eng for gerar views (templates HTML), estilos, componentes Edge ou lógicas interativas de tela.
---

# Padrões de Frontend — tavolo (Edge.js + Tailwind CSS)

## 1. Visão Geral

O frontend do tavolo segue o modelo Server-Side Rendering (SSR) acoplado diretamente ao AdonisJS:

| Tecnologia         | Finalidade                                  |
|--------------------|---------------------------------------------|
| `Edge.js`          | Motor de templates (HTML dinâmico)          |
| `Tailwind CSS`     | Estilização utilitária rápida e responsiva  |
| `Alpine.js` (Opc.) | Reatividade leve no client-side (modais, etc)|

> [!IMPORTANT]
> Todo o código de View DEVE ser escrito com componentes e tags do Edge.js.
> A estilização DEVE ser feita por utilitários Tailwind em linha.
> Não use bibliotecas SPA como React, Vue ou Angular sem aprovação.

---

## 2. Padrões Edge.js

### 2.1. Estrutura de Layout Base

Os templates devem utilizar componentes de layout.

```edge
{{-- resources/views/components/layout/app.edge --}}
<!DOCTYPE html>
<html lang="pt-BR" class="dark"> <!-- Dark Mode padrão -->
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ title || 'Tavolo ERP' }}</title>
  
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen font-sans antialiased">
  <nav class="bg-gray-800 border-b border-gray-700 p-4">
    <!-- Navbar / Sidebar -->
  </nav>

  <main class="container mx-auto p-4 sm:p-6 lg:p-8">
    {{{ await $slots.main() }}}
  </main>
</body>
</html>
```

### 2.2. Uso do Layout na View

```edge
{{-- resources/views/pages/mesas/index.edge --}}
@layout.app({ title: 'Gerenciar Mesas' })

  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Mesas do Salão</h1>
    <a href="{{ route('mesas.create') }}" class="btn-primary">Nova Mesa</a>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
    @each(mesa in mesas)
      @!component('components/mesa_card', { mesa })
    @end
  </div>

@end
```

---

## 3. Estilização (Tailwind CSS)

### 3.1. Design System — Classes e Componentes Edge

Para evitar duplicação enorme de strings de classes Tailwind (como em botões), crie componentes Edge para abstrair esses estilos.

```edge
{{-- resources/views/components/button.edge --}}
@let(baseClass = "inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors")
@let(variants = {
  primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  secondary: "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700 focus:ring-gray-500",
  danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
})

@let(btnClass = variants[variant || 'primary'])

<button type="{{ type || 'button' }}" class="{{ baseClass }} {{ btnClass }} {{ $props.class || '' }}" {{{ $props.serializeExcept(['type', 'class', 'variant']) }}}>
  {{{ await $slots.main() }}}
</button>
```

### 3.2. Estilo Visual Principal

- **Cores Primárias**: `blue-600` para destaque (botões principais).
- **Fundo**: `gray-900` para o background geral, `gray-800` para cards/superfícies.
- **Bordas**: `gray-700` para separadores sutis no dark theme.
- **Textos**: `gray-100` para títulos, `gray-300` ou `gray-400` para textos secundários.

### 3.3. Responsividade

A aplicação será acessada por PDVs (computadores com tela widescreen) e Garçons (celulares).
Garanta que os layouts reagem adequadamente usando prefixos:
`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.

---

## 4. Reatividade Simples (Alpine.js)

Se houver necessidade de interações cliente (tabs, modais, dropdowns) sem recarregar a página, utilize Alpine.js em vez de jQuery ou Vanilla JS extenso.

```html
<div x-data="{ open: false }" class="relative">
  <button @click="open = !open" class="text-gray-300 hover:text-white">Opções</button>
  
  <div x-show="open" @click.away="open = false" class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-10" x-cloak>
    <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Editar</a>
    <a href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Remover</a>
  </div>
</div>
```

---

## 5. Proibições e Anti-padrões

| Proibido          | Motivo                                          |
|-------------------|--------------------------------------------------|
| Flutter/Dart      | Esta é uma aplicação Web usando Edge.js          |
| jQuery            | Use Alpine.js ou APIs Vanilla modernas           |
| Arquivos CSS puros| Use classes utilitárias do Tailwind no HTML      |
| Light Mode padrão | O tema do sistema é fixado em Dark Mode (`.dark`) para reduzir fadiga visual em ambientes noturnos. |
