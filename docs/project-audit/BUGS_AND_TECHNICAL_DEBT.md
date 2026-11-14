# Bugs, Risks & Technical Debt

"Confirmed" = established by reading both sides of the code path (and, where stated, tool output).
None were reproduced over HTTP or on a device in this audit. File references are relative to the repo root.

## A. Confirmed bugs

| ID | Severity | Bug | Evidence | Recommended fix |
|---|---|---|---|---|
| B-01 | **High (security)** | Suspended/banned users keep full API access. | `presentation/auth-guards.ts` `requireAuth` only verifies the JWT; `refresh-session.use-case.ts` never checks `user.status`; `suspend-user.use-case.ts` only updates status, doesn't revoke refresh tokens. A suspended user refreshes forever. | In `SuspendUserUseCase` call `refreshTokens.revokeAllForUser`; check `status === ACTIVE` in `RefreshSessionUseCase`; optionally a status check in `requireAuth`. Same for provider/company suspension where relevant. |
| B-02 | **High (money)** | Multi-step money movements are not atomic. | No `prisma.$transaction` in finance/contract/remote/dispute code (only one in the whole backend, in payout-account defaults). E.g. `ReleaseEscrowUseCase`: escrow claim → journal entry → transaction → second entry → wallet credit, each a separate commit. A crash/error mid-way leaves ledger, escrow and wallet out of sync. | Introduce a unit-of-work/transaction-client seam in repositories and run each use case's writes in one `$transaction`; keep the optimistic escrow claim inside it. |
| B-03 | **High (blocks sign-up)** | OTP screen receives a corrupted phone when it starts with `+`. | `apps/mobile/lib/features/auth/presentation/register_screen.dart:73` builds `'/otp?phone=$phone&…'` without encoding; `app_router.dart` reads `state.uri.queryParameters['phone']`, which decodes `+` as space → backend `findByPhone(" 249…")` → `404 USER_NOT_FOUND`. | `Uri.encodeQueryComponent(phone)` when building the route (or pass via `extra`). Also normalise phone (strip spaces) before sending. |
| B-04 | **High (core flow)** | On-demand matching can never find a provider. | `infrastructure/on-demand/distance-rating-provider-matcher.ts` requires `ProviderCategory` rows and a `ProviderServiceArea` containing the request point; there is no API, admin action, or seed that creates either. Requests stay `SEARCHING`. Same for `/providers?categoryId=` (remote picker). | Add provider category + service area endpoints (and Flutter UI), or an admin tool, before testing dispatch. |
| B-05 | **High (core flow)** | Users cannot become providers or create companies from the app. | `POST /providers` and `POST /companies` exist but no Flutter repository calls them. Workspace derivation (`current_user.dart`) therefore always yields "customer" for app-only users. | Add onboarding screens calling these endpoints, then `refreshCurrentUser()`. |
| B-06 | **High (security, if mock reachable)** | Payment webhook for `mock` uses a public default secret. | `payment-provider-registry.ts` `resolveByName("mock")` builds `MockPaymentProvider(config?.webhookSecret)` → defaults to `"mock-dev-secret"` when no config row. Anyone can sign `/api/v1/webhooks/payments/mock` events and flip transaction statuses. | Refuse the mock provider when `NODE_ENV=production`; require an explicit secret. |
| B-07 | **High (money)** | Real money is never collected: funding always "succeeds" via the mock gateway. | `PaymentProviderRegistry.resolveForRegion` falls back to `MockPaymentProvider` when no `PaymentGatewayConfig` (DB has 0). Providers get withdrawable balances backed by no payment. | Block funding when no real gateway is configured in production; build a real adapter. |
| B-08 | Medium | Money unit inconsistency between app and admin. | Flutter parses the typed integer and sends it as-is (`int.parse(...)`), displays `amount.toString()`; backend stores minor units; admin `format-money.ts` divides by 100. | Decide unit (SDG has piastres → ×100); convert in Flutter input/output with a shared money formatter including currency. |
| B-09 | Medium | Cancelling a contract or remote engagement strands funded escrow. | `cancel-contract.use-case.ts` / `cancel-remote-engagement.use-case.ts` only change status; HELD milestone escrows are never refunded. Either party can cancel. | Refund/cancel open escrows (or forbid cancellation while funds are held) inside the same transaction. |
| B-10 | Medium | Hive cache is never initialised. | `LocalCache.init()` is never called (`main.dart`; referenced `app/bootstrap.dart` doesn't exist). All `LocalCache` reads/writes are no-ops. | Call `LocalCache.init()` in `main()` before `runApp` (wrapped in try/catch), or remove the cache. |
| B-11 | Medium | Home layout/remote config not invalidated on account switch. | `_invalidateUserScopedProviders()` doesn't include `homeLayoutProvider`/`remoteConfigRepositoryProvider`, yet `/home-layout` is per-user targeted. | Add them to the invalidation list. |
| B-12 | Medium | Transient network error during refresh logs the user out. | `auth_interceptor.dart` `_refreshOnce` catch-all calls `tokenStorage.clear()` for any exception, including timeouts. | Only clear on 401 from `/auth/refresh`; surface network failures without wiping the session. |
| B-13 | Medium | Admin sessions expire after 15 minutes; logout doesn't revoke the refresh token. | `presentation/admin-session.ts` (no refresh path), `app/admin/logout-action.ts`. | Implement cookie refresh; call `LogoutUseCase` on logout. |
| B-14 | Medium | Malformed JSON bodies produce raw 500s. | Every route does `await req.json()` outside a try/catch for `SyntaxError`. | Wrap body parsing in a helper returning `400 INVALID_JSON`. |
| B-15 | Low | Realtime server can't authenticate anyone when started via npm script. | `tsx` doesn't load `.env`; `jwt.verify(token, process.env.JWT_PUBLIC_KEY ?? "")`. | Load env in `server.ts`. |
| B-16 | Low | Language choice not persisted, `preferredLanguage` ignored after login. | `locale_controller.dart` always starts `ar`; only Welcome screen switches. | Persist locale; apply user preference after `/users/me`. |
| B-17 | Low | Mock capture of a full amount returns 0 when a new provider instance is resolved. | `MockPaymentProvider.authorizedAmounts` is per-instance; registry creates a new instance per call. Current callers always pass the amount explicitly, so impact is latent. | Persist authorized amount on the transaction instead. |

## B. Incomplete integrations

- **SMS**: `ConsoleOtpSender` only (prints codes to the server log).
- **Payments**: only `MockPaymentProvider`; no Sudanese gateway/mobile-money adapter.
- **Storage**: no upload endpoint; documents/portfolio/ads require pre-hosted URLs. Cloudinary env vars unused.
- **Push**: `firebase-admin` unused; no `DeviceToken` registration; Flutter has no Firebase.
- **Maps/location**: none in backend or app; on-demand location is typed manually.
- **Realtime/chat**: skeleton only.
- **Background jobs**: BullMQ queues unused; no schedulers for escrow expiry, scheduled dispatch, scheduled broadcasts, settlements.
- **Workflow engine**: no dispatcher; definitions are inert.
- **AI**: registry never consumed.
- **Transactional notifications**: none (offers, bids, milestones, withdrawals don't notify anyone).

## C. Architectural risks & debt

1. **Single-currency ledger**: `LedgerAccount.code` is unique and carries one currency; multi-region (ADR-001) needs per-currency accounts.
2. **No DB transaction seam** in repository interfaces (see B-02) — the biggest structural debt.
3. **Polymorphic references without FKs** (Escrow, PaymentTransaction, Dispute…) — orphan risk; validated only in app code.
4. **Duplicate route boilerplate**: every route re-implements the `try { requireAuth … } catch instanceof …` ladder; error codes are hand-mapped per route. A shared handler wrapper would remove ~40% of route code.
5. **Duplicated contract/remote modules** — milestone, funding, release logic mirrored almost line-for-line.
6. **Events without consumers** — `DomainEvent` grows unbounded with no `processedAt` writer.
7. **No pagination metadata**; Flutter never paginates.
8. **No rate limiting** on auth/OTP endpoints beyond the OTP resend interval/attempt cap; no IP throttling.
9. **No request logging/observability** (traceId is generated per error but not logged).
10. **`packages/shared/package.json` `main: ./index.ts` doesn't exist** — works only because imports use deep paths via tsconfig aliases. Zod schemas are not consumed by Flutter despite the comment saying so.
11. **Docs drift**: `apps/backend/README.md` still says escrow/payment wiring is not built; CI comment says no lockfile.
12. **`*.pem` not in `.gitignore`**; project is not under git yet.
13. **Android release** signed with debug key; app label `sahl_mobile`; no iOS config reviewed beyond absence of Firebase files.
14. **Prisma 5** — CLI reports a major update available (not urgent).
15. **`RemoteConfigEntry @@unique([key, regionId])`** doesn't prevent duplicate global keys (NULL regionId) in Postgres.

## D. Lint / analyzer findings

- Backend ESLint: 1 warning — unused `input` in `mock-payment-provider.ts:43`.
- Flutter analyze: 31 infos (`prefer_initializing_formals`, `use_null_aware_elements`), 0 warnings/errors.
