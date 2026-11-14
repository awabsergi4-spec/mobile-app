# SAHL — Project Overview

> Audit date: 2026-11-14. Based on reading the source, not on README/status claims. See
> [FEATURE_STATUS.md](FEATURE_STATUS.md) for evidence-backed status per feature.

## 1. What SAHL is

SAHL ("سهل") is a multi-sided services marketplace, initially targeting **Sudan** (seeded region `SD`,
currency `SDG`, default language Arabic). It connects customers with service providers across three
service models:

| Model | What it is | Backend module |
|---|---|---|
| **On-Demand** | Instant or scheduled local jobs (towing, plumbing, electrical). Customer posts a request with a location; the system offers it to the single best-matched provider (sequential dispatch). | `on-demand` |
| **Contract** | Larger projects (construction, legal). Customer posts a project, providers bid, customer awards a bid → Contract with milestones paid through escrow. | `contract` |
| **Remote** | Remote work (programming, design). Customer picks a provider directly and creates an engagement with milestones, revisions, meetings. | `remote` |

Cross-cutting: a double-entry **Financial Core** (ledger, wallets, escrow, commissions, withdrawals,
settlements, disputes), **Companies** (business accounts with members/invitations/verification),
**Provider verification**, **Notifications**, a **Workflow Engine** (definitions only — see blockers),
**Remote Config / Home Layout**, **Advertisements / Promotions**, an **AI integration layer**
(toggles + adapters, no runtime consumer), and a server-rendered **Admin Platform**.

## 2. Users and workspaces

One identity (`User`, phone + password), multiple roles derived from DB relations
(`GET /api/v1/users/me`):

- **Customer** — every user. Posts on-demand requests, contract projects, remote engagements.
- **Provider** — user with a `ProviderProfile`. Receives offers, bids, does remote work, withdraws earnings.
- **Company** — user who owns or is a member of a `Company` (OWNER / MANAGER / STAFF).
- **Staff (admin)** — user with a `UserStaffRole`; permissions via `StaffRole → Permission`. Only used by the Admin Platform.

The Flutter app picks a single "workspace" shell with priority **COMPANY > PROVIDER > CUSTOMER**.

## 3. Repository layout

```
SAHL_Project/
├── package.json            npm workspaces: apps/backend, packages/shared (NOT apps/mobile)
├── apps/
│   ├── backend/            Next.js 15 app: REST API (/api/v1/*) + Admin Platform (/admin/*) + realtime server
│   │   ├── prisma/         schema.prisma (93 models), 1 migration (init), seed.ts
│   │   └── src/{domain,application,infrastructure,presentation,app,realtime}
│   └── mobile/             Flutter app (Riverpod, GoRouter, Dio, Hive CE, secure storage)
├── packages/shared/schemas Zod request schemas shared by API routes (imported as @sahl/shared/schemas/*)
├── docs/                   Original design specs (00-*, 01–10) + this audit (project-audit/)
└── .github/workflows/ci.yml  backend lint/typecheck/test, mobile analyze/test
```

## 4. System architecture

```
 Flutter app (Android/iOS/web)                      Admin browser
   Screen → Riverpod controller → Repository          Server Components + Server Actions
     → ApiClient (Dio + AuthInterceptor)                 (cookie session, same process)
          │  HTTPS JSON, Bearer JWT (RS256)                     │
          ▼                                                     ▼
 ┌────────────────────────── Next.js 15 (apps/backend) ──────────────────────────┐
 │ middleware.ts (CORS for /api/v1/*)                                             │
 │ app/api/v1/**/route.ts  ── presentation (zod validate, guards, envelope)       │
 │ app/admin/**            ── admin pages + "use server" actions                  │
 │        │                                                                       │
 │ application/*  use cases (framework-free)                                      │
 │ domain/*       entities + repository/service interfaces                         │
 │ infrastructure/* Prisma repos, *-services.ts singletons (manual DI),            │
 │                  argon2, jsonwebtoken, MockPaymentProvider, AI adapters         │
 └───────────────────────────────┬───────────────────────────────────────────────┘
                                 ▼
                         PostgreSQL (Prisma 5)
 Separate process (not wired to anything yet): src/realtime/server.ts (Socket.IO + Redis adapter)
 Registered but unused: BullMQ queues (src/infrastructure/jobs/queue.ts) — no workers
```

Key properties:

- **Clean-architecture layering** with hand-wired singletons per module in
  `src/infrastructure/<module>/<module>-services.ts` — no DI container.
- **Uniform response envelope** (`src/presentation/http-response.ts`):
  success `{success:true, message, data, pagination?, metadata?}`;
  error `{success:false, errorCode, message, details?, traceId, timestamp}`.
- **Money is integer minor units** everywhere; the ledger (`JournalEntry`/`JournalLine`) is the source of truth, `WalletBalance` is a subsidiary ledger.
- **Domain events** are persisted (`DomainEvent`) on most state transitions, but nothing consumes them yet.

## 5. Main workflows (as implemented)

1. **Sign-up**: register → OTP request (code printed to the server console) → OTP verify (`PHONE_VERIFICATION`) → user `ACTIVE` → login.
2. **On-demand**: customer creates request → matcher picks a provider → `OnDemandAssignment` OFFERED → provider accepts/declines (decline re-matches) → provider moves EN_ROUTE → IN_PROGRESS → COMPLETED. **No price, no payment.** In practice matching never finds a provider today (see blockers).
3. **Contract**: post project → providers bid → customer awards → contract milestones → customer funds milestone (mock gateway → escrow) → provider IN_PROGRESS/SUBMITTED → customer APPROVED → admin `mark-paid` releases escrow to provider wallet minus commission → contract complete.
4. **Remote**: same milestone/escrow pattern as Contract, plus deliver / revisions / meetings / complete.
5. **Payouts**: provider requests withdrawal (amount locked from AVAILABLE) → admin approve/reject → mark paid/failed → optional settlement batch.
6. **Disputes**: party opens dispute on a milestone → escrow DISPUTED → admin resolves (release / refund / split).

## 6. Related audit documents

- [FLUTTER_ARCHITECTURE.md](FLUTTER_ARCHITECTURE.md)
- [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)
- [DATABASE_REFERENCE.md](DATABASE_REFERENCE.md)
- [ADMIN_PLATFORM.md](ADMIN_PLATFORM.md)
- [API_CONTRACTS.md](API_CONTRACTS.md)
- [ENVIRONMENT_AND_SETUP.md](ENVIRONMENT_AND_SETUP.md)
- [FEATURE_STATUS.md](FEATURE_STATUS.md)
- [BUGS_AND_TECHNICAL_DEBT.md](BUGS_AND_TECHNICAL_DEBT.md)
- [LAUNCH_READINESS.md](LAUNCH_READINESS.md)
