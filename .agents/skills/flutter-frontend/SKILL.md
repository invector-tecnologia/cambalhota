---
name: flutter-frontend
description: >
  Padrões obrigatórios de implementação Flutter para o frontend do Veterin.
  Ativar quando o agente eng for gerar código Flutter, criar telas, widgets,
  providers, blocs, rotas ou testes de widget.
---

# Padrões de Frontend Flutter — Veterin

## 1. Visão Geral

O frontend do Veterin é construído com a seguinte stack:

| Tecnologia        | Finalidade                                |
|--------------------|-------------------------------------------|
| Flutter (stable)   | Framework de UI multiplataforma           |
| Riverpod / Bloc    | Gerenciamento de estado                   |
| go_router          | Navegação declarativa e deep linking      |
| Dark Mode          | Tema visual padrão da aplicação           |
| Responsivo         | Suporte a mobile, tablet e desktop        |

> [!IMPORTANT]
> Todo código Flutter gerado DEVE seguir os padrões descritos neste documento.
> O tema dark-mode é obrigatório. Layouts devem ser responsivos para os 3 breakpoints definidos.

---

## 2. Gerenciamento de Estado

### Riverpod (recomendado)

Riverpod é o gerenciador de estado recomendado para o Veterin. Usar Providers com `ref.watch` e `ref.read`.

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider para listar animais do tenant
final animaisProvider = FutureProvider.autoDispose<List<Animal>>((ref) async {
  final service = ref.watch(animalServiceProvider);
  return service.listar();
});

/// StateNotifier para gerenciar estado mutável
final animalFormProvider =
    StateNotifierProvider.autoDispose<AnimalFormNotifier, AnimalFormState>(
  (ref) => AnimalFormNotifier(ref.watch(animalServiceProvider)),
);

class AnimalFormNotifier extends StateNotifier<AnimalFormState> {
  final AnimalService _service;

  AnimalFormNotifier(this._service) : super(AnimalFormState.initial());

  Future<void> salvar() async {
    state = state.copyWith(carregando: true, erro: null);
    try {
      await _service.criar(state.toInput());
      state = state.copyWith(carregando: false, sucesso: true);
    } catch (e) {
      state = state.copyWith(carregando: false, erro: e.toString());
    }
  }
}
```

### Bloc/Cubit (alternativa)

Usar quando a lógica de estado exigir transições discretas e rastreáveis.

```dart
import 'package:flutter_bloc/flutter_bloc.dart';

/// Cubit para controle de listagem
class AnimaisCubit extends Cubit<AnimaisState> {
  final AnimalService _service;

  AnimaisCubit(this._service) : super(AnimaisInicial());

  Future<void> carregar() async {
    emit(AnimaisCarregando());
    try {
      final animais = await _service.listar();
      emit(AnimaisCarregado(animais));
    } catch (e) {
      emit(AnimaisErro(e.toString()));
    }
  }
}

/// Estados discretos
abstract class AnimaisState {}
class AnimaisInicial extends AnimaisState {}
class AnimaisCarregando extends AnimaisState {}
class AnimaisCarregado extends AnimaisState {
  final List<Animal> animais;
  AnimaisCarregado(this.animais);
}
class AnimaisErro extends AnimaisState {
  final String mensagem;
  AnimaisErro(this.mensagem);
}
```

---

## 3. Navegação — go_router

### Configuração declarativa com deep linking

```dart
import 'package:go_router/go_router.dart';

final goRouter = GoRouter(
  initialLocation: '/dashboard',
  redirect: (context, state) {
    final autenticado = /* verificar autenticação */;
    if (!autenticado && !state.matchedLocation.startsWith('/login')) {
      return '/login';
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/animais',
          builder: (context, state) => const AnimaisScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => AnimalDetalheScreen(
                id: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/usuarios',
          builder: (context, state) => const UsuariosScreen(),
        ),
      ],
    ),
  ],
);
```

### Regras de navegação

- SEMPRE usar `context.go()` para navegação principal (substitui a rota).
- Usar `context.push()` para empilhar telas (detalhes, formulários).
- Usar `context.pop()` para voltar.
- NUNCA usar `Navigator.push` ou `Navigator.of(context)` diretamente.

---

## 4. Design System — Paleta Dark Mode

> [!IMPORTANT]
> O Veterin usa dark mode como tema padrão. Todas as telas DEVEM respeitar a paleta abaixo.

### Cores obrigatórias

| Token        | Hex         | Uso                                    |
|--------------|-------------|----------------------------------------|
| Primary      | `#3b82f6`   | Botões principais, links, destaques    |
| Success      | `#10b981`   | Status positivo, confirmações          |
| Danger       | `#ef4444`   | Erros, exclusões, alertas críticos     |
| Highlight    | `#8b5cf6`   | Badges, elementos de destaque          |
| Alert        | `#f59e0b`   | Avisos, atenção necessária             |
| Background   | `#1a1a2e`   | Fundo principal da aplicação           |
| Cards        | `#16213e`   | Fundo de cards e containers            |
| Accent Dark  | `#0f3460`   | Bordas, separadores, fundos secundários|
| Accent Light | `#e94560`   | Chamadas de ação, hover, ícones ativos |

### Definição no código

```dart
import 'package:flutter/material.dart';

class VeterinColors {
  VeterinColors._();

  static const primary    = Color(0xFF3b82f6);
  static const success    = Color(0xFF10b981);
  static const danger     = Color(0xFFef4444);
  static const highlight  = Color(0xFF8b5cf6);
  static const alert      = Color(0xFFf59e0b);
  static const background = Color(0xFF1a1a2e);
  static const cards      = Color(0xFF16213e);
  static const accentDark = Color(0xFF0f3460);
  static const accentLight = Color(0xFFe94560);
}

/// Tema global da aplicação
ThemeData veterinTheme() {
  return ThemeData.dark().copyWith(
    scaffoldBackgroundColor: VeterinColors.background,
    colorScheme: const ColorScheme.dark(
      primary: VeterinColors.primary,
      secondary: VeterinColors.highlight,
      error: VeterinColors.danger,
      surface: VeterinColors.cards,
    ),
    cardTheme: const CardThemeData(
      color: VeterinColors.cards,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: VeterinColors.background,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: VeterinColors.accentDark.withValues(alpha: 0.3),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: VeterinColors.accentDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: VeterinColors.primary, width: 2),
      ),
    ),
  );
}
```

---

## 5. Widgets Customizados Obrigatórios

Todo projeto Veterin DEVE implementar os seguintes widgets reutilizáveis:

### Lista de widgets obrigatórios

| Widget          | Finalidade                                    |
|-----------------|-----------------------------------------------|
| `FormInput`     | Campo de texto com validação e estilo padrão  |
| `FormSelect`    | Dropdown com estilo padrão                    |
| `PrimaryButton` | Botão principal com loading state             |
| `ModernTable`   | Tabela com paginação, ordenação e busca       |
| `StatCard`      | Card de estatística para dashboards           |
| `StatusBadge`   | Badge colorido de status                      |
| `AlertBanner`   | Banner de alerta/notificação                  |

### Exemplo — FormInput

```dart
class FormInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final IconData? prefixIcon;

  const FormInput({
    super.key,
    required this.label,
    required this.controller,
    this.validator,
    this.obscureText = false,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      obscureText: obscureText,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: VeterinColors.primary)
            : null,
      ),
    );
  }
}
```

### Exemplo — PrimaryButton

```dart
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool carregando;
  final IconData? icon;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.carregando = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      child: ElevatedButton(
        onPressed: carregando ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: VeterinColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: carregando
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(label),
                ],
              ),
      ),
    );
  }
}
```

### Exemplo — StatusBadge

```dart
class StatusBadge extends StatelessWidget {
  final String texto;
  final Color cor;

  const StatusBadge({
    super.key,
    required this.texto,
    required this.cor,
  });

  /// Fábricas de conveniência
  factory StatusBadge.ativo() => const StatusBadge(texto: 'Ativo', cor: VeterinColors.success);
  factory StatusBadge.inativo() => const StatusBadge(texto: 'Inativo', cor: VeterinColors.danger);
  factory StatusBadge.pendente() => const StatusBadge(texto: 'Pendente', cor: VeterinColors.alert);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: cor.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cor.withValues(alpha: 0.5)),
      ),
      child: Text(
        texto,
        style: TextStyle(
          color: cor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
```

---

## 6. Responsividade — 3 Breakpoints

### Definição dos breakpoints

| Layout    | Largura          | Navegação        |
|-----------|------------------|------------------|
| Mobile    | < 768px          | `Drawer`         |
| Tablet    | 768px – 1024px   | `NavigationRail` |
| Desktop   | > 1024px         | `Sidebar` fixa   |

### Implementação com LayoutBuilder + MediaQuery

```dart
class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final largura = constraints.maxWidth;

        if (largura > 1024) {
          return _DesktopLayout(child: child);
        } else if (largura >= 768) {
          return _TabletLayout(child: child);
        } else {
          return _MobileLayout(child: child);
        }
      },
    );
  }
}

/// Desktop — sidebar fixa à esquerda
class _DesktopLayout extends StatelessWidget {
  final Widget child;
  const _DesktopLayout({required this.child});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(
          width: 260,
          child: VeterinSidebar(),
        ),
        Expanded(child: child),
      ],
    );
  }
}

/// Tablet — NavigationRail compacto
class _TabletLayout extends StatelessWidget {
  final Widget child;
  const _TabletLayout({required this.child});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        NavigationRail(
          backgroundColor: VeterinColors.cards,
          selectedIndex: 0, // vincular ao estado da rota
          destinations: const [
            NavigationRailDestination(
              icon: Icon(Icons.dashboard),
              label: Text('Dashboard'),
            ),
            NavigationRailDestination(
              icon: Icon(Icons.pets),
              label: Text('Animais'),
            ),
            NavigationRailDestination(
              icon: Icon(Icons.people),
              label: Text('Usuários'),
            ),
          ],
          onDestinationSelected: (index) {
            // navegar via go_router
          },
        ),
        Expanded(child: child),
      ],
    );
  }
}

/// Mobile — Drawer com menu hambúrguer
class _MobileLayout extends StatelessWidget {
  final Widget child;
  const _MobileLayout({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Veterin'),
        backgroundColor: VeterinColors.background,
      ),
      drawer: const VeterinDrawer(),
      body: child,
    );
  }
}
```

### Utilidade para verificar breakpoint

```dart
enum ScreenSize { mobile, tablet, desktop }

ScreenSize getScreenSize(BuildContext context) {
  final largura = MediaQuery.sizeOf(context).width;
  if (largura > 1024) return ScreenSize.desktop;
  if (largura >= 768) return ScreenSize.tablet;
  return ScreenSize.mobile;
}
```

---

## 7. Efeitos Visuais

### Glassmorphism com BackdropFilter

```dart
class GlassContainer extends StatelessWidget {
  final Widget child;
  final double blur;
  final double opacidade;

  const GlassContainer({
    super.key,
    required this.child,
    this.blur = 10.0,
    this.opacidade = 0.1,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: opacidade),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
```

### Micro-animações

> [!TIP]
> Use `AnimatedContainer`, `AnimatedOpacity` e `Hero` para transições suaves.
> Duração padrão: **300ms**. Curva padrão: `Curves.easeInOut`.

```dart
/// Padrão de transição — 300ms
const kVeterinAnimationDuration = Duration(milliseconds: 300);
const kVeterinAnimationCurve = Curves.easeInOut;

/// Exemplo de card com animação de hover/press
class AnimatedStatCard extends StatefulWidget {
  final String titulo;
  final String valor;
  final IconData icone;
  final Color cor;

  const AnimatedStatCard({
    super.key,
    required this.titulo,
    required this.valor,
    required this.icone,
    required this.cor,
  });

  @override
  State<AnimatedStatCard> createState() => _AnimatedStatCardState();
}

class _AnimatedStatCardState extends State<AnimatedStatCard> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: AnimatedContainer(
        duration: kVeterinAnimationDuration,
        curve: kVeterinAnimationCurve,
        transform: _hover
            ? (Matrix4.identity()..scale(1.02))
            : Matrix4.identity(),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: VeterinColors.cards,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _hover
                ? widget.cor.withValues(alpha: 0.5)
                : VeterinColors.accentDark.withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(widget.icone, color: widget.cor, size: 32),
            const SizedBox(height: 12),
            Text(
              widget.valor,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.titulo,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Hero transitions entre telas

```dart
// Na tela de listagem
Hero(
  tag: 'animal-${animal.id}',
  child: AnimalCard(animal: animal),
)

// Na tela de detalhe
Hero(
  tag: 'animal-${animal.id}',
  child: AnimalDetalheHeader(animal: animal),
)
```

---

## 8. Padrão de Testes

### Regras obrigatórias

1. Usar `flutter_test` com `WidgetTester`.
2. SEMPRE chamar `pump()` após interações e `pumpAndSettle()` para aguardar animações.
3. Usar `find.byType()` e `find.byKey()` para localizar widgets.
4. Todo widget customizado DEVE ter pelo menos um teste.

### Exemplo de teste de widget

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PrimaryButton', () {
    testWidgets('deve exibir o label corretamente', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrimaryButton(label: 'Salvar'),
          ),
        ),
      );

      expect(find.text('Salvar'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('deve exibir loading quando carregando', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrimaryButton(label: 'Salvar', carregando: true),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Salvar'), findsNothing);
    });

    testWidgets('deve chamar onPressed ao ser clicado', (tester) async {
      var clicado = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryButton(
              label: 'Salvar',
              onPressed: () => clicado = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(clicado, isTrue);
    });

    testWidgets('deve desabilitar botão quando carregando', (tester) async {
      var clicado = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryButton(
              label: 'Salvar',
              carregando: true,
              onPressed: () => clicado = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(clicado, isFalse);
    });
  });

  group('StatusBadge', () {
    testWidgets('deve exibir texto e cor corretos', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(texto: 'Ativo', cor: Colors.green),
          ),
        ),
      );

      expect(find.text('Ativo'), findsOneWidget);
    });
  });
}
```

---

## 9. Proibições

> [!CAUTION]
> As seguintes tecnologias e práticas são PROIBIDAS no projeto Veterin.

| Proibido          | Motivo                                          |
|-------------------|--------------------------------------------------|
| jQuery            | Não aplicável a Flutter                          |
| Angular           | Framework concorrente, não usado no projeto       |
| React             | Framework concorrente, não usado no projeto       |
| Dependências CDN  | Flutter não usa CDN; dependências via pubspec.yaml|
| `Navigator.push`  | Usar `go_router` (context.go/push/pop)           |
| Cores hardcoded   | Usar sempre `VeterinColors.*`                    |
| Light mode         | Tema dark-mode é obrigatório                     |

---

## 10. Estrutura de Diretórios

```
lib/
├── main.dart               # Ponto de entrada da aplicação
├── app.dart                 # MaterialApp.router com tema e go_router
├── screens/                 # Telas completas (uma por rota)
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── animais/
│   │   ├── animais_screen.dart
│   │   └── animal_detalhe_screen.dart
│   ├── login/
│   │   └── login_screen.dart
│   └── usuarios/
│       └── usuarios_screen.dart
├── widgets/                 # Widgets reutilizáveis
│   ├── form_input.dart
│   ├── form_select.dart
│   ├── primary_button.dart
│   ├── modern_table.dart
│   ├── stat_card.dart
│   ├── status_badge.dart
│   ├── alert_banner.dart
│   ├── glass_container.dart
│   ├── app_shell.dart
│   └── veterin_sidebar.dart
├── providers/               # Riverpod providers
│   ├── auth_provider.dart
│   ├── animais_provider.dart
│   └── usuarios_provider.dart
├── models/                  # Classes de dados / DTOs
│   ├── animal.dart
│   ├── usuario.dart
│   └── auth_state.dart
├── services/                # Comunicação com API
│   ├── api_client.dart
│   ├── animal_service.dart
│   ├── auth_service.dart
│   └── usuario_service.dart
└── theme/                   # Tema e cores
    ├── veterin_colors.dart
    └── veterin_theme.dart

test/
├── widgets/                 # Testes de widgets
│   ├── form_input_test.dart
│   ├── primary_button_test.dart
│   └── status_badge_test.dart
├── screens/                 # Testes de telas
│   └── dashboard_screen_test.dart
└── providers/               # Testes de providers
    └── animais_provider_test.dart
```

### Regras de organização

- **Uma tela por arquivo** dentro de `screens/`.
- **Widgets reutilizáveis** em `widgets/` — NUNCA definir widgets reutilizáveis dentro de arquivos de tela.
- **Providers** em `providers/` — um arquivo por domínio.
- **Models** em `models/` — classes de dados puras com `fromJson`/`toJson`.
- **Services** em `services/` — comunicação HTTP com a API backend.
- **Tema** em `theme/` — cores e ThemeData centralizados.
