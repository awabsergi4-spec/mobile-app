# Feature Status Inventory

## Verification levels used

| Level | Meaning | What was done in this audit |
|---|---|---|
| L1 | Implemented in source | Read the code |
| L2 | Builds | Backend `tsc --noEmit` ✅, `eslint` ✅ (1 warning), `next build` ✅; Flutter `analyze` ✅ (0 errors/warnings, 31 infos) |
| L3 | Unit/integration tested | Backend 145 tests ✅ (in-memory fakes); Flutter 33 tests ✅ |
| L4 | Verified against real DB | Only: migrations up to date, `prisma validate`, seed data present (read-only counts) |
| L5 | Verified via real HTTP | **Not done** — no server was started against the DB in this audit |
| L6 | Verified on Android emulator | **Not done** |
| L7 | Production-like deployment | **Not done** — no deployment config exists |

So **no feature is verified beyond L3**. Statuses below describe completeness of the code path end-to-end
(backend + admin + Flutter), not runtime proof.

Legend: **Implemented** (complete path exists) · **Partial** (some layers missing) · **Missing** (schema/spec only) · **Broken** (code exists but cannot work as wired).

## Identity & access

| Feature | Status | Evidence |
|---|---|---|
| Register (phone/password) | Implemented (L3) | `auth/register` route + use case + tests; Flutter `register_screen.dart` |
| OTP request/verify (phone verification) | **Broken for `+` numbers** in Flutter; backend Implemented | Flutter builds `/otp?phone=$phone` unencoded → `+` becomes space (B-03). OTP delivery is console-only |
| Login with password | Implemented (L3) | route, use case, tests, Flutter |
| OTP login | Partial | backend supports `LOGIN` purpose; Flutter has no OTP-login entry point |
| Refresh rotation + reuse detection | Implemented (L3) | `refresh-session.use-case.ts`, Flutter `AuthInterceptor` single-flight refresh |
| Logout | Implemented | revokes refresh token; Flutter invalidates user-scoped providers |
| Password reset | Missing | enum value only, no endpoint |
| Profile edit (name, photo, language) | Missing | no `PATCH /users/me` |
| Suspension enforcement | **Broken** | `requireAuth` ignores status; refresh doesn't check status; suspend doesn't revoke tokens (B-01) |
| Admin RBAC | Implemented | 15 permission keys seeded = keys used in code; every page/action guarded |
| Staff/role management | Missing | seed-only |

## Provider

| Feature | Status | Evidence |
|---|---|---|
| Become a provider | **Partial** | `POST /providers` exists; Flutter never calls it → provider workspace unreachable from app (B-05) |
| Profile view/edit, availability | Implemented | `/providers/me`, Flutter `provider_profile_screen.dart` |
| Documents + verification submit | Partial | URL-only (no upload); admin review works; per-document review API-only |
| Portfolio, payout accounts | Implemented (URL/JSON entry) | routes + Flutter screens |
| Categories / service areas / working hours | **Missing** | no write path anywhere → matching finds nobody (B-04) |
| Suspend/reactivate/delete (admin) | Implemented (L3) | admin actions + tests |

## Company

| Feature | Status | Evidence |
|---|---|---|
| Create company | Partial | API only; no Flutter flow |
| Members, invitations, role change, removal | Implemented (L3) | routes, guards, tests, Flutter screens |
| Company documents + verification | Implemented (URL-only) | |
| Company acting as customer/provider | Missing | company home only shows members/verification |
| Branches/departments/contacts | Missing | schema only |

## Services

| Feature | Status | Evidence |
|---|---|---|
| On-demand create/list/detail/cancel | Implemented (manual lat/lng) | Flutter screens + routes |
| On-demand matching & offers | **Broken in practice** | matcher requires `ProviderCategory` + `ProviderServiceArea`, nothing creates them; requests stay SEARCHING |
| Provider accept/decline offers | Implemented (L3) | Flutter `provider_assignment_list_screen.dart` |
| Provider job progress (EN_ROUTE→COMPLETED) | Partial | API only, no Flutter UI |
| Live tracking | Partial | API only; no realtime, no maps |
| On-demand pricing & payment | **Missing** | no price on request, `quotedPrice` never set, no escrow path |
| Scheduled on-demand dispatch | Missing | SCHEDULED requests are never matched (no scheduler) |
| Contract: post, browse, bid, award, withdraw | Implemented (L3) | Flutter + routes |
| Contract milestones: create/list | Implemented | |
| Contract milestone status / fund / complete / cancel / documents | Partial | API only, no Flutter UI |
| Remote: create (pick provider), list, detail, milestones | Implemented | |
| Remote deliver/complete/cancel/revisions/meetings/fund/status | Partial | API only |

## Financial core

| Feature | Status | Evidence |
|---|---|---|
| Double-entry ledger + invariant | Implemented (L3) | `prisma-ledger-service.ts`, `ledger-invariant.test.ts` |
| Escrow fund/release/refund/cancel/expire | Implemented (L3) — not atomic | no DB transactions (B-02); expire has no scheduler |
| Payments | **Mock only** | `MockPaymentProvider` always succeeds; no real gateway (L-01) |
| Commission | Implemented, inactive | calculator + tests; no rules seeded, no admin UI |
| Wallet view & transactions | Implemented | `/wallets/me`, Flutter wallet screen |
| Withdrawals (request → approve/reject → paid/failed) | Implemented (L3) | Flutter request screen + admin UI |
| Settlements | Implemented (L3) | admin UI |
| Disputes open/resolve | Implemented (L3) | Flutter open sheet (milestones only), admin resolve |
| Refunds | Partial | admin API only, no UI |
| Milestone payout release | Partial | admin API `mark-paid` only, no admin UI button |
| Trial balance / reconciliation | Implemented (read-only) | admin reports page |
| Payment webhooks | Implemented for mock | default HMAC secret is public when no config row (B-06) |
| Subscriptions, coupons, tax, exchange rates, referral rewards | Missing | schema only |

## Engagement & content

| Feature | Status | Evidence |
|---|---|---|
| In-app notifications (list/read/unread) | Implemented — only fed by admin broadcasts | no transactional notifications |
| Push notifications (FCM) | Missing | no firebase code, no device-token endpoint |
| Chat / messaging | Missing | schema + realtime skeleton only |
| Reviews & ratings | Missing | `ratingAverage` is never updated |
| Favorites, support tickets, reports | Missing | schema only |
| Home layout (dynamic home) | Partial | read API + Flutter renderer; no admin editor, 0 blocks in DB → empty home |
| Remote config | Partial | admin CRUD + `/config`; Flutter never reads a key (no maintenance/min-version) |
| Advertisements, promotions | Partial | admin CRUD + read APIs; Flutter doesn't display; promotions never affect prices |
| CMS pages, popups, templates | Missing | schema only |
| Search | Missing | only provider list by category |

## Platform

| Feature | Status | Evidence |
|---|---|---|
| Workflow engine | Partial (definitions only) | admin CRUD; no event dispatcher, no instances ever created |
| Background jobs | Missing | queues declared, never imported, no workers |
| Realtime | Skeleton | `realtime/server.ts`; doesn't load `.env`; nothing emits |
| File uploads | Missing | `StorageProvider` interface only |
| AI features | Partial (config only) | toggles + adapters; nothing consumes `AiRegistry` |
| Audit log | Implemented | written by admin/finance use cases; admin viewer |
| Localization ar/en | Implemented (app) | 258/258 keys; locale not persisted; admin is English-only |
| CI | Present | `.github/workflows/ci.yml` (lint/typecheck/test/analyze); comment about lockfile outdated |
| Deployment config | Missing | no Dockerfile, no hosting config, no staging/prod URLs |
