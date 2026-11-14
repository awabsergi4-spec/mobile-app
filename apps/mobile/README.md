# SAHL Mobile

Flutter app (customer + provider, single app, role-switchable per [docs/01-product-overview.md](../../docs/01-product-overview.md) §5).

## Layout

```
lib/
├── app/                 # root widget, DI wiring
├── core/
│   ├── theme/            # Material 3, orange brand, light/dark (app_theme.dart)
│   ├── l10n/              # ARB resources (en/ar) + generated AppLocalizations
│   ├── routing/           # go_router config
│   ├── remote_config/     # RemoteConfigRepository — the app renders backend-driven config/home-layout, ADR-007
│   └── network/           # API client, interceptors (not yet built)
└── features/
    ├── auth/               # domain/application/infrastructure/presentation per feature
    ├── on_demand/
    ├── contract/
    ├── remote/
    └── provider/
```

Each feature slice follows the same layering as the backend (see [docs/02-architecture.md](../../docs/02-architecture.md) §2): `domain` (entities, no Flutter imports), `application` (use cases / Riverpod notifiers), `infrastructure` (API/repo implementations), `presentation` (widgets/screens). Only `auth/presentation/welcome_screen.dart` is built so far, as the wiring reference.

## Setup

```bash
flutter pub get
flutter gen-l10n   # regenerates lib/core/l10n/generated from the ARB files after editing them
flutter run
```

## Localization

Add/edit strings in `lib/core/l10n/arb/app_en.arb` and `app_ar.arb` (English is the template file). Never hardcode UI strings in widgets — always go through `AppLocalizations.of(context)!`.

## Backend-driven config and home screen

Per [ADR-007](../../docs/02-architecture.md#11-adr-007-admin-panel-as-platform-control-center), this app is a thin client wherever possible: feature flags, limits, and the home screen layout come from the backend (`RemoteConfigRepository`, [`core/remote_config`](lib/core/remote_config)), not hardcoded Dart. `supportedHomeBlockTypes` in [`home_layout_block.dart`](lib/core/remote_config/home_layout_block.dart) is the *only* thing that needs a new app release when the backend adds a block type this build can't render — everything else about a block (content, targeting, scheduling) is data. Only a genuinely new client-side rendering capability (a new block type, a new native permission) is a reason to ship an update; content, config, and layout changes never are.
