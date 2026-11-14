# Flutter App Architecture (`apps/mobile`)

Package `sahl_mobile`, Android applicationId `com.sair.sahl.sahl_mobile`. Flutter 3.44.9 / Dart SDK `^3.12.2`
on the audit machine. ~150 Dart files under `lib/` (≈13.4k lines incl. generated l10n).

## 1. Dependencies

| Concern | Package |
|---|---|
| State management | `flutter_riverpod` 2.x (`Provider`, `NotifierProvider`, `FutureProvider`, families) — no code generation |
| Navigation | `go_router` 14 |
| HTTP | `dio` 5 |
| Token storage | `flutter_secure_storage` |
| Local cache | `hive_ce` / `hive_ce_flutter` (**never initialised — see bugs**) |
| i18n | `flutter_localizations`, `intl`, gen-l10n (`l10n.yaml`) |
| UI | Material 3, `google_fonts` (IBM Plex Sans Arabic / Inter, fetched at runtime), `material_symbols_icons` |

Not present: maps/geolocation, image picker/upload, Firebase/FCM, socket.io client, payment SDK.

## 2. Entry point and initialisation

`lib/main.dart` → `runApp(ProviderScope(child: SahlApp()))`. Nothing else is initialised before first
frame (no `WidgetsFlutterBinding`/Hive/Firebase bootstrap; `local_cache.dart` references an
`app/bootstrap.dart` that does not exist).

`lib/app/app.dart` → `MaterialApp.router` with `goRouterProvider`, `localeControllerProvider`
(default **`ar`**), `themeModeControllerProvider` (default `ThemeMode.system`), `AppTheme.light/dark(locale)`.

## 3. Folder structure

```
lib/
├── app/app.dart
├── core/
│   ├── config/app_config.dart          APP_ENV + API_BASE_URL via --dart-define
│   ├── errors/                          AppFailure sealed class, failure_localizer
│   ├── l10n/arb/app_{en,ar}.arb         258 keys each, parity verified
│   ├── l10n/generated/                  gen-l10n output (committed)
│   ├── networking/                      ApiClient, AuthInterceptor, LoggingInterceptor, failure_mapper, providers
│   ├── remote_config/                   /config + /home-layout repository, HomeLayoutBlock
│   ├── routing/app_router.dart          single GoRouter + auth redirect
│   ├── storage/                         SecureTokenStorage, LocalCache (Hive)
│   ├── theme/                           colors, spacing, radius, motion, typography, theme
│   └── utils/result.dart                Result<T> = Success | Failure
├── features/<feature>/{domain,data,application,presentation}
│     auth, company, contract, dispute, home, notification, on_demand,
│     provider, remote, service_category, wallet
└── shared/{utils/validators.dart, widgets/*}
```

Per-feature layering: `domain` (immutable models with `fromJson`), `data` (abstract repository +
`*_repository_impl.dart` using `ApiClient`, returns `Result<T>`), `application` (Riverpod
controllers/providers), `presentation` (screens + widgets).

## 4. Networking

- `ApiClient` (`core/networking/api_client.dart`): one Dio instance, base URL `AppConfig.apiBaseUrlWithVersion`
  (`<API_BASE_URL>/api/v1`). Unwraps the backend envelope into `ApiResponseEnvelope{data,message,pagination,metadata}`.
  Throws `AppFailureException(AppFailure)` on any `DioException`.
- `AuthInterceptor`: adds `Authorization: Bearer <access>` unless `extra.skipAuth`; on 401 performs **one**
  shared refresh (`POST /auth/refresh` via a bare Dio) and retries once; on failure calls
  `AuthController.handleSessionExpired()`.
- `failure_mapper.dart`: maps timeouts/connection errors → `NetworkFailure`, 401 → `UnauthorizedFailure`,
  envelope `errorCode` → `ApiFailure(errorCode, statusCode, message)`, 5xx → `ServerFailure`.
- `LoggingInterceptor` only when `kDebugMode && !production`, redacts sensitive fields.
- Default base URL: Android → `http://10.0.2.2:3000`, others → `http://localhost:3000`.

## 5. Authentication & session

`features/auth/application/auth_controller.dart` (`NotifierProvider<AuthController, AuthState>`):

- `build()` schedules `restoreSession()`: if tokens exist in secure storage → `GET /users/me` → authenticated, else unauthenticated.
- `register` → `POST /auth/register`; the screen then calls `requestOtp(PHONE_VERIFICATION)` and pushes `/otp?phone=…&purpose=…`.
- `verifyOtp` stores tokens only when the backend returns `outcome: "session"` (LOGIN purpose).
- `login` → `POST /auth/login` → save tokens → `GET /users/me`.
- `logout` → `POST /auth/logout` with the refresh token, clear storage, invalidate user-scoped providers.
- `_invalidateUserScopedProviders()` invalidates 23 user-scoped providers on login/logout/expiry
  (wallet, notifications, disputes, on-demand, contracts, remote, provider, company…).
  **Not included:** `homeLayoutProvider` / `remoteConfigRepositoryProvider`, service-category providers.

`CurrentUser.workspace`: `companyId != null` → company, else `providerProfileId != null` → provider, else customer.

## 6. Routing (`core/routing/app_router.dart`)

Single `GoRouter` (built once) with `refreshListenable` bridged from `authControllerProvider`.
Redirect: initial/restoring → `/splash`; unauthenticated → only `/`, `/login`, `/register`, `/otp`;
authenticated on those → `/home`. **No role-based guards** (backend enforces).

| Route | Screen |
|---|---|
| `/splash` | SessionRestoringScreen |
| `/`, `/login`, `/register`, `/otp?phone&purpose` | Welcome / Login / Register / OTP |
| `/home` | HomeScreen → Customer / Provider / Company home by workspace |
| `/on-demand`, `/on-demand/new`, `/on-demand/offers`, `/on-demand/:id` | Customer list, create, provider offers, detail |
| `/contracts`, `/contracts/new`, `/contracts/browse`, `/contracts/my-bids`, `/contracts/projects/:id`, `/contracts/:id` | Contract flows |
| `/remote`, `/remote/new`, `/remote/bookings`, `/remote/:id` | Remote flows (customer / provider) |
| `/wallet`, `/wallet/withdrawals` | Wallet, withdrawals |
| `/disputes` | My disputes |
| `/notifications` | Notifications |
| `/company/invitations`, `/company/:id/members`, `/company/:id/verification` | Company |
| `/provider/profile`, `/provider/verification`, `/provider/portfolio`, `/provider/payout-accounts` | Provider |

## 7. Experiences by workspace

- **Customer home**: app bar (notification bell, wallet, menu: on-demand, contracts, remote, disputes, company invitations, logout); body = `HomeLayoutBlockList` from `/home-layout` (renders a simple list tile per block; DB currently has 0 blocks and there is no admin editor → empty state).
- **Provider home**: availability toggle, offers, browse projects, remote bookings, disputes, invitations, profile, verification, portfolio, payout accounts, wallet.
- **Company home**: members and verification only (no customer/service flows for company users).

### Missing app capabilities (backend exists, no Flutter call)
Become a provider (`POST /providers`), create a company (`POST /companies`), fund milestones,
change milestone status, complete/cancel contracts and projects, contract documents, on-demand
provider status updates (EN_ROUTE/IN_PROGRESS/COMPLETED), live tracking, on-demand assignment list,
remote deliver/complete/cancel/revisions/meetings, advertisements, promotions, user profile editing.
See [API_CONTRACTS.md](API_CONTRACTS.md) for the full matrix.

## 8. Localization, RTL, theme

- Arabic default, English supported; direction follows `Locale` automatically.
- Language switch exists only on the Welcome screen; it is **not persisted** and the user's
  `preferredLanguage` from `/users/me` is not applied after login.
- ARB key parity: 258 / 258, no missing keys. One hardcoded string: `'SAHL'` label in `welcome_screen.dart`.
- Theme tokens in `core/theme/*`; typography via Google Fonts downloaded at runtime (no bundled font assets).

## 9. Error handling

Repositories never throw to the UI; they return `Result.failure(AppFailure)`.
`core/errors/failure_localizer.dart` turns failures into localized messages; `shared/widgets/
async_value_view.dart`, `error_banner.dart`, `empty_state_view.dart` render states.

## 10. Tests

`test/`: failure_localizer, failure_mapper, app_router redirect, auth_controller, validators, widget
smoke test — **33 tests, all passing** (2026-11-14). No repository/contract tests against JSON fixtures,
no integration tests, no device tests.

## 11. Platform configuration

- Android `AndroidManifest.xml`: `INTERNET` permission only (no location, camera, notifications).
- Debug-only `network_security_config.xml` allows cleartext to `10.0.2.2`, `localhost`, `127.0.0.1` only —
  a physical device on a LAN IP over HTTP will be blocked.
- Release build is **signed with the debug key** (`android/app/build.gradle.kts`), label `sahl_mobile`.
- No `google-services.json` / `GoogleService-Info.plist`.
