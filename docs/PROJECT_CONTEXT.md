# SAHL — Project Context (read this first)

Primary reference for AI coding sessions. Last full audit: **2026-11-14**. Details live in
[`docs/project-audit/`](project-audit/). Original design specs: `docs/00-*.md`, `docs/01–10-*.md`
(intent, not necessarily implemented).

## Identity

SAHL ("سهل") — services marketplace for Sudan (region `SD`, currency `SDG`, Arabic-first, English supported).
Three service models: **On-Demand** (instant local jobs, auto-matched), **Contract** (post → bid → award →
escrowed milestones), **Remote** (pick provider → engagement → escrowed milestones). Plus a double-entry
Financial Core, Companies, provider verification, and a server-rendered Admin Platform.

## Backend split (in progress, since 2026-11-14)

The backend is moving from Next.js to **FastAPI** (`apps/api`, see its README). Next.js (`apps/backend`)
becomes the **Admin Platform only**. Phase 1 is done:
- FastAPI serves **all 59 endpoints the Flutter app calls** (port 8000), on the same PostgreSQL schema, with
  one DB transaction per request. Flutter's default base URL is now `:8000`.
- **No OTP at sign-up**: users register with an account type (customer / provider / company), stay
  `PENDING_VERIFICATION`, and an admin approves them (Admin → Users → Approve account).
- Admin login and the Users module call FastAPI over HTTP (`src/presentation/sahl-api.ts`, env `SAHL_API_URL`).
  All other admin modules still run in-process against Prisma until ported.
- Schema/migrations are owned by Alembic (`apps/api/alembic`, baseline `0001_baseline`); Prisma's schema is
  kept only for the not-yet-ported admin modules.
- Fixed in FastAPI: B-01 (suspension now revokes sessions and blocks every request), B-02 for ported endpoints,
  B-03 (OTP removed, phones normalised), B-11, B-14. Not fixed: money units (B-08), matching data (B-04).

## Stack & locations

| Part | Tech | Path |
|---|---|---|
| **API (mobile + admin auth/users)** | FastAPI, SQLAlchemy 2 Core (reflected tables), psycopg 3, PyJWT RS256, argon2-cffi, Alembic, pytest | `apps/api` |
| Admin + legacy API | Next.js 15 App Router, TypeScript strict, Prisma 5, PostgreSQL, Zod, argon2, jsonwebtoken (RS256) | `apps/backend` |
| Legacy API routes (being retired) | `route.ts` per endpoint, 137 handlers | `apps/backend/src/app/api/v1/**` |
| Admin UI | Server Components + Server Actions, Tailwind | `apps/backend/src/app/admin/**` |
| Domain / use cases / infra | Clean architecture | `apps/backend/src/{domain,application,infrastructure,presentation}` |
| DI wiring | hand-written singletons | `apps/backend/src/infrastructure/<module>/<module>-services.ts` |
| Request schemas | Zod, imported as `@sahl/shared/schemas/<x>.schema` | `packages/shared/schemas` |
| DB schema | 93 models, 1 migration, seed | `apps/backend/prisma` |
| Realtime (skeleton) | Socket.IO + Redis | `apps/backend/src/realtime/server.ts` |
| Mobile | Flutter 3.44, Riverpod 2 (no codegen), GoRouter 14, Dio 5, secure storage, gen-l10n | `apps/mobile` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

## Conventions (follow these)

- **Backend flow**: route (validate with shared Zod schema, `requireAuth`/`requirePermission`, party guard)
  → use case (`application/<module>/<verb>-<noun>.use-case.ts`, constructor-injected interfaces)
  → repository interface (`domain/`) → `Prisma*Repository` (`infrastructure/`).
- Responses only via `ok()` / `fail()` from `presentation/http-response.ts`; error codes UPPER_SNAKE.
- Domain errors are classes in `application/<module>/errors.ts`, mapped to HTTP in each route.
- Money = **integer minor units**; never accept amounts/currency for payments from the client; ledger is source of truth.
- Every state transition publishes a `DomainEvent`; admin mutations write `AuditLog`.
- Tests: Vitest with hand-written fakes in `__tests__/fakes.ts` (no mocking library).
- Permissions: the 15 keys in `prisma/seed.ts` are the complete set; add new keys there.
- **Flutter flow**: Screen → Riverpod controller (`features/<f>/application`) → repository (`data/`, returns `Result<T>`) → `ApiClient`. Models in `domain/` with `fromJson`. All strings via `AppLocalizations` (update both ARB files, then `flutter gen-l10n`). Add new user-scoped providers to `AuthController._invalidateUserScopedProviders()`.
- Don't introduce mock data; don't redesign UI; preserve names.

## Auth model

Phone + password; access JWT RS256 `{sub}` 15m; opaque refresh token (SHA-256 in DB) 30d with rotation and
reuse detection; OTP 6 digits printed to server console. Roles: customer (everyone), provider (`ProviderProfile`),
company (owner/member), staff (`UserStaffRole` → permissions). App workspace priority: company > provider > customer.
Admin uses cookies `sahl_admin_access` / `sahl_admin_refresh` (no refresh implemented).

## Current status (summary)

- Builds: backend typecheck ✅, lint ✅ (1 warning), `next build` ✅, Prisma validate ✅; Flutter analyze ✅ (infos only).
- Tests: backend 145/145 ✅, Flutter 33/33 ✅ — unit level only. **Nothing verified over HTTP or on a device.**
- Local DB migrated + seeded (region, 7 categories, ledger accounts, RBAC, admin user). Redis not running (not needed by API).
- Works in code: auth, provider/company management, contract bidding, remote engagement creation, wallet/withdrawals,
  disputes, admin moderation & finance ops, ads/promotions/broadcasts/config CRUD.
- Missing/partial: on-demand pricing/payment, provider categories/service areas (matching finds no one), provider/company
  onboarding in app, most lifecycle actions in app (fund, milestone status, deliver, complete), uploads, SMS, real payment
  gateway, push, chat, reviews, search, workflow execution, background jobs, home-layout editor, deployment.

## Known bugs / blockers (top)

Still open: B-02 in the legacy Next.js finance paths · B-04 matching can't find providers · B-06/07 mock gateway &
public webhook secret · B-08 money units app vs admin · B-09 cancel strands escrow. B-05 is half-done (provider/company
created at sign-up; no "become provider" later). Full list: [BUGS_AND_TECHNICAL_DEBT.md](project-audit/BUGS_AND_TECHNICAL_DEBT.md)
(written before the split — B-01/B-03/B-11/B-14 are fixed in `apps/api`).

## Run locally (Windows)

1. **API** (`apps/api`): `.env` with the same `DATABASE_URL` and JWT keys as `apps/backend/.env`;
   `.venv/Scripts/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` (launch.json: `sahl-api`).
2. **Admin** (`apps/backend`): `.env` with `DATABASE_URL`, JWT keys, `SAHL_API_URL="http://localhost:8000"`;
   `npm install` → `npx prisma generate` → `npx prisma db seed` (first time) → `npm run dev` → `http://localhost:3000/admin/login`.
3. **Mobile** (`apps/mobile`): `flutter pub get` → `flutter run`. By default the app uses the **deployed API on Render**
   (`https://mobile-app-ynec.onrender.com`, `AppConfig.renderApiBaseUrl`, backed by Neon). For a local API pass
   `--dart-define=API_BASE_URL=http://10.0.2.2:8000` (emulator) or, for a USB phone, `adb reverse tcp:8000 tcp:8000`
   plus `--dart-define=API_BASE_URL=http://localhost:8000`.
   On this PC Gradle needs `JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\tmp\jdk-uds -Djava.net.preferIPv4Stack=true'`
   (JDK 17 "Unable to establish loopback connection").
New sign-ups appear in Admin → Users with a "waiting for approval" banner. JWT key generation and device setup:
[ENVIRONMENT_AND_SETUP.md](project-audit/ENVIRONMENT_AND_SETUP.md).

## Audit documents

[PROJECT_OVERVIEW](project-audit/PROJECT_OVERVIEW.md) · [FLUTTER_ARCHITECTURE](project-audit/FLUTTER_ARCHITECTURE.md) ·
[BACKEND_ARCHITECTURE](project-audit/BACKEND_ARCHITECTURE.md) · [DATABASE_REFERENCE](project-audit/DATABASE_REFERENCE.md) ·
[ADMIN_PLATFORM](project-audit/ADMIN_PLATFORM.md) · [API_CONTRACTS](project-audit/API_CONTRACTS.md) ·
[ENVIRONMENT_AND_SETUP](project-audit/ENVIRONMENT_AND_SETUP.md) · [FEATURE_STATUS](project-audit/FEATURE_STATUS.md) ·
[BUGS_AND_TECHNICAL_DEBT](project-audit/BUGS_AND_TECHNICAL_DEBT.md) · [LAUNCH_READINESS](project-audit/LAUNCH_READINESS.md)
