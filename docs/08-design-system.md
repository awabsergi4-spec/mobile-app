# SAHL — Design System (Engineering Reference)

Status: Draft v1.0 · Source: [00-ui-ux-design-system.md](00-ui-ux-design-system.md) · Implementation: `apps/mobile/lib/core/theme/`

This doc translates the design spec into concrete engineering decisions and where each token lives in code. The spec itself has no code; this is the bridge.

## 1. Token → File Map

| Token category | Spec values | Implementation |
|---|---|---|
| Color | See spec §Color System | [`app_colors.dart`](../apps/mobile/lib/core/theme/app_colors.dart) (raw hex constants) + [`app_theme.dart`](../apps/mobile/lib/core/theme/app_theme.dart) (assembled into `ColorScheme` + `SahlSemanticColors` extension) |
| Typography | Inter (en) / IBM Plex Sans Arabic (ar) | [`app_typography.dart`](../apps/mobile/lib/core/theme/app_typography.dart) |
| Spacing | 4/8/12/16/20/24/32/40/48/64, 8px grid | [`app_spacing.dart`](../apps/mobile/lib/core/theme/app_spacing.dart) |
| Border radius | Card 16, Dialog 20, Button 14, Bottom Sheet 24, Search Field 16, Image 12 | [`app_radius.dart`](../apps/mobile/lib/core/theme/app_radius.dart), wired into component themes in `app_theme.dart` |
| Motion | Short 150ms, Normal 250ms, Complex 350ms | [`app_motion.dart`](../apps/mobile/lib/core/theme/app_motion.dart) |

## 2. Decision: Semantic Colors via `ThemeExtension`, Not Raw Constants in Widgets

**Problem**: Material 3's `ColorScheme` has fixed named roles (`primary`, `secondary`, `tertiary`, `error`, …) — it has no `success`/`warning`/`info`/`accent` roles, but the spec requires all four as first-class semantic colors.

**Decision**: `SahlSemanticColors` is a `ThemeExtension<SahlSemanticColors>` registered on both the light and dark `ThemeData`, holding `success`/`warning`/`info`/`accent` (each with light/dark variants). Widgets read them via `Theme.of(context).extension<SahlSemanticColors>()!`, the same way they read `Theme.of(context).colorScheme`.

**Why**: This is Flutter's documented mechanism for extending a theme with app-specific tokens. The alternative — importing `AppColors.success` directly into widgets — works but bypasses the theming system: it can't be swapped per-theme (a widget importing the raw constant has no way to know if light or dark is active) and doesn't show up next to `colorScheme` in IDE autocomplete for theme-aware colors. Every other Material color in this app is theme-aware; semantic colors should be too.

## 3. Decision: Google Fonts Package for Now, Bundled Assets Before Production

**Problem**: Inter, IBM Plex Sans Arabic, and Cairo aren't bundled with Flutter. They need to come from somewhere.

**Decision**: Use the `google_fonts` package for now (fetches and caches font files at first use). `app_typography.dart` selects the font family based on the active `Locale` (`en` → Inter, `ar` → IBM Plex Sans Arabic).

**Why deferred rather than bundling font files now**: bundling requires the actual `.ttf`/`.otf` assets, which aren't available in this environment; `google_fonts` unblocks development immediately with the correct typefaces.

**Revisit before production**: [00-functional-requirements.md](00-functional-requirements.md)'s Offline Support requirement (view cached data, draft requests, reconnect sync) is undermined by a font that needs a network fetch on first run in a fresh install. Before shipping, switch `google_fonts` to its asset-bundled mode (ship the `.ttf` files under `assets/fonts/` and reference them in `pubspec.yaml`) so first paint never depends on network. Tracked in [07-roadmap.md](07-roadmap.md).

## 4. Decision: `material_symbols_icons` Package for Icons

**Problem**: the spec specifies "Material Symbols Rounded" — a specific, newer icon family with variable fill/weight axes. Flutter's built-in `Icons` class ships the older classic Material Icons font; `Icons.xxx_rounded` constants exist but are a different glyph set, not true Material Symbols.

**Decision**: use the `material_symbols_icons` package, which provides the actual Material Symbols font with `Rounded`/`Outlined`/`Sharp` variants and a `fill` parameter — matching the spec's "filled for active state, outlined for inactive state, never mix icon families" rule directly (same family, `fill: 1` vs `fill: 0`, rather than swapping between different icon sets).

**Consequence**: existing `Icons.*` references in scaffolded screens (e.g. `welcome_screen.dart`) should migrate to `Symbols.*` as those screens are built out — not a blocking retrofit, but the convention going forward.

## 5. Spacing / Radius / Motion as Static Const Classes

Flutter's `ThemeData` has no first-class "spacing scale" concept (unlike a CSS design-token system), and radius is set per-component rather than globally. So:

- `AppSpacing` (xs=4 … giant=64) is referenced directly in widget code (`padding: EdgeInsets.all(AppSpacing.base)`) — there's no theme-level indirection to add here without fighting the framework.
- `AppRadius` values are wired into `app_theme.dart`'s component themes (`CardTheme`, dialog shape, `FilledButtonThemeData`, bottom sheet theme, `InputDecorationTheme`) so most widgets get the correct radius automatically just by using the standard Material widgets, and only need `AppRadius` directly for one-off custom shapes (e.g. image thumbnails at 12px).
- `AppMotion` durations pair with a single shared easing curve (`Curves.easeInOutCubic` — a "smooth" curve per the spec, avoiding both linear motion and overly bouncy curves that would read as playful rather than "professional, confident").

## 6. Accessibility Baseline

- Minimum touch target 48×48dp: enforced via `MaterialTapTargetSize.padded` (Flutter's default) — verified per-screen as they're built, not automatically guaranteed by the theme alone for custom widgets.
- Color contrast: `ColorScheme.onPrimary`/`onSurface` etc. are white/near-black against the spec's colors, which passes WCAG AA for large text/UI components; small-text contrast against the raw brand orange has **not** been formally audited yet — flagged as a to-do before real screens ship with orange text (not just orange buttons/icons, which have a lower contrast bar).
- Dynamic text scaling: Flutter's default `TextScaler` respects system settings automatically as long as text uses `Theme.of(context).textTheme` (not hardcoded `fontSize`) — enforced by convention, not by a lint rule yet.

## 7. Screen Inventory — Not Built Yet

The spec's full screen inventory (Home, Search, Provider Profile, Customer/Provider Dashboards, Request Details, Contract/Remote Service screens, Wallet, Notifications, Messages, Settings, empty/error/loading states) is a reference for **future feature work**, not built in this pass — building all of them now, ahead of the application-layer use cases they depend on, would mean UI with no real data behind it. Each screen gets built alongside its corresponding backend vertical slice (see [07-roadmap.md](07-roadmap.md) Phase 1 breakdown) and must pass the spec's Design Quality Checklist before merge — folded into the existing review checklist, not tracked as a separate gate.
