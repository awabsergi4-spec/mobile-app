# Backend Architecture (`apps/backend`)

Next.js 15 (App Router) + TypeScript 5 (strict, `noUncheckedIndexedAccess`) + Prisma 5 + PostgreSQL.
~524 files under `src/`. The same Next.js process serves the **REST API** (`/api/v1/*`) and the
**Admin Platform** (`/admin/*`). A separate **realtime** process (`src/realtime/server.ts`) exists but is a skeleton.

## 1. Layers

| Layer | Path | Rule |
|---|---|---|
| Domain | `src/domain/<module>/` | Entities, repository/service **interfaces**, domain errors. No Prisma, no Next. |
| Application | `src/application/<module>/` | One class per use case (`*.use-case.ts`), constructor-injected interfaces, `errors.ts` per module, `__tests__/` with hand-written fakes. |
| Infrastructure | `src/infrastructure/<module>/` | `Prisma*Repository` implementations + `<module>-services.ts` that instantiates singletons (manual DI). |
| Presentation | `src/presentation/` + `src/app/api/v1/**/route.ts` + `src/app/admin/**` | Zod validation (`@sahl/shared/schemas/*`), guards, error→HTTP mapping, envelope. |

Path aliases: `@/*` → `src/*`; `@sahl/shared/*` → `../../packages/shared/*` (tsconfig + vitest).

### Dependency wiring (service locator files)
`infrastructure/identity/auth-services.ts`, `provider/provider-services.ts` (also exports the shared
`auditLogWriter` and `domainEventPublisher`), `company/company-services.ts`, `on-demand/on-demand-services.ts`,
`contract/contract-services.ts`, `remote/remote-services.ts`, `finance/finance-services.ts`,
`dispute/dispute-services.ts`, `notification/notification-services.ts`, `advertisement/…`, `promotion/…`,
`remote-config/…`, `ai/ai-feature-toggle-services.ts`, `workflow/workflow-admin-services.ts`,
`admin/admin-services.ts`, `audit/audit-services.ts`, `home-layout/…`, `service-category/…`.

Importing `auth-services.ts` **throws at import time** if `JWT_PRIVATE_KEY` or `JWT_PUBLIC_KEY` is missing.
Since nearly every route imports it, a missing key breaks the whole API and admin.

## 2. Modules and use cases

| Module | Use cases (application/…) | Tests |
|---|---|---|
| identity | register-user, login-with-password, request-otp, verify-otp, refresh-session, logout, suspend-user, reactivate-user, session-issuer | 6 files |
| provider | create/update profile, set-availability, submit/review verification, suspend/reactivate/delete | 6 files |
| company | create/update/delete, invite/accept/cancel invitation, remove member, update member role, submit/review verification, suspend/reactivate | 4 files |
| on-demand | create request (+match), accept/decline assignment (decline re-matches), update status, cancel, record tracking ping | 3 files |
| contract | create project, submit/withdraw/award bid, create milestone, update milestone status, fund milestone, release milestone payment, complete/cancel contract, cancel project, upload document | 3 files |
| remote | create engagement, create/fund/update/release milestone, deliver, complete, cancel, request revision, update revision status, schedule meeting | 2 files |
| finance | initiate/capture/refund payment, fund/release/refund/cancel/expire escrow, request/approve/reject/mark-paid/mark-failed withdrawal, create/complete settlement, process payment webhook | 6 files (+commission calculator test) |
| dispute | open-dispute, resolve-dispute (release/refund/split) | 1 integration-style file |
| notification | create-broadcast, send-broadcast (fan-out to `Notification` rows), mark-read | — |
| advertisement / promotion / remote-config / ai / workflow | admin CRUD + activate/deactivate/publish/archive | — |
| targeting | `matches-targeting-rules.ts` (shared targeting evaluator) | — |

**Test run (2026-11-14): 31 files, 145 tests, all passing.** All tests use in-memory fakes — none hit Postgres or HTTP.

## 3. HTTP layer

- 137 route handlers (60 admin, 77 public/user). Full list with guards: [API_CONTRACTS.md](API_CONTRACTS.md).
- Envelope from `presentation/http-response.ts` (`ok()` / `fail()`).
- Validation: `schema.safeParse(await req.json())` → `400 VALIDATION_ERROR` with `details: zod.flatten()`.
  Malformed JSON bodies are **not** caught (→ unhandled 500).
- Error mapping is per-route `instanceof` chains; unknown errors re-thrown → Next.js 500 (no envelope).
- Lists return plain arrays; cursor/limit are accepted on some routes but no `pagination` metadata is returned.
- `src/middleware.ts`: CORS only for `/api/v1/*`, allowlist from `ALLOWED_ORIGINS`.

## 4. Authentication

- **Passwords**: argon2id (`argon2-password-hasher.ts`).
- **Access token**: JWT **RS256**, claims `{sub}` only, TTL `ACCESS_TOKEN_TTL` (default 15m). Signed with
  `JWT_PRIVATE_KEY`, verified with `JWT_PUBLIC_KEY` (`jwt-token-service.ts`).
- **Refresh token**: 32 random bytes hex, stored as SHA-256 hash in `RefreshToken`, TTL `REFRESH_TOKEN_TTL`
  (default 30d). Rotation on every refresh; presenting a revoked token revokes **all** of the user's tokens.
- **OTP**: 6 digits, SHA-256 hashed, 5 attempts, expiry/resend interval from RemoteConfig keys
  `otp.expiry_seconds` (300) / `otp.min_resend_interval_seconds` (60). Delivered by `ConsoleOtpSender`
  (prints the code to the server log — no SMS provider).
- Login requires `status === ACTIVE`; registration creates `PENDING_VERIFICATION`; `PHONE_VERIFICATION` OTP activates.
- `requireAuth()` only verifies the JWT — it does **not** check user status (suspended users keep access, see bugs).

## 5. Authorization

Three independent axes:

1. **Platform RBAC** (admin): `requirePermission(req, key, …)` (API) / `requireAdminPermission(key)` (pages & server actions).
   Permission keys are seeded in `prisma/seed.ts` (15 keys, all granted to `SUPER_ADMIN`); code uses exactly the same 15.
   Fail-closed: zero permissions ⇒ not an admin session.
2. **Party guards**: `presentation/{on-demand,contract,remote}-guards.ts` — caller must be the customer or the assigned/awarded provider; per-edge rules in routes (e.g. provider may set milestone IN_PROGRESS/SUBMITTED, customer APPROVED; PAID only via admin release).
3. **Company guards**: `presentation/company-guards.ts` — OWNER/MANAGER checks for member management.

## 6. Financial Core (summary — details in DATABASE_REFERENCE.md)

- `PrismaLedgerService.postJournalEntry` enforces debits = credits per currency, account existence/active/currency; idempotency key on `JournalEntry`.
- Escrow release/refund use optimistic "claim" updates (`updateMany` with expected status/amount) to prevent double release.
- `ReleaseEscrowUseCase` posts two journal entries (provider share → `PROVIDER_WALLETS_PAYABLE`, commission → `COMMISSION_REVENUE`) and credits wallet `AVAILABLE`.
- Commission: `PrismaCommissionCalculator` — provider > subscription plan > category > global rule; percentage + flat fee, min/max clamp. No active rules seeded ⇒ commission 0.
- **No Prisma `$transaction` around multi-step money movements** (only one `$transaction` in the whole codebase, for payout-account default switching). See bugs.
- Payment gateway: `PaymentProviderRegistry` → only `MockPaymentProvider` exists (always authorizes/captures/refunds; webhook HMAC with default secret `mock-dev-secret` when no config row).

## 7. Events, jobs, realtime, workflows

- `PrismaDomainEventPublisher` writes `DomainEvent` rows. **Nothing reads them** (no dispatcher/worker).
- `infrastructure/jobs/queue.ts` declares 4 BullMQ queues; **not imported anywhere**, no workers.
- Workflow engine: admin CRUD over `WorkflowDefinition`; `ActionExecutorRegistry` supports `RELEASE_ESCROW`, `SEND_MESSAGE` but is **never invoked** — no workflow instance is ever created.
- Realtime (`npm run realtime:dev`): Socket.IO + Redis streams adapter, JWT check, one handler `conversation:join`. Nothing emits events; no Flutter client. Runs via `tsx` which does **not** load `.env`.
- Notifications: only admin broadcasts create `Notification` rows. No transactional notifications (offers, status changes), no FCM push (`firebase-admin` dependency unused), no `DeviceToken` endpoint.

## 8. AI layer

Domain interfaces for 9 capabilities, rule-based defaults, OpenAI-compatible adapter + failover registry.
`AiRegistry` is not used by any route or use case; only the admin toggle CRUD is live.

## 9. Not implemented in backend (schema exists, no code)

Chat (`Conversation`/`Message`), reviews/ratings, favorites, support tickets, reports, referrals,
coupons, subscriptions, tax rules, refund policies, exchange rates, CMS pages, popups, message templates,
search/search log, service-category admin CRUD, home-layout admin CRUD, provider categories /
service areas / working hours / availability slots, company branches/departments/contacts,
device tokens, file uploads (Cloudinary `StorageProvider` interface only), SMS OTP sender, real payment gateway.
