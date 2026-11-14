# Admin Platform

Location: `apps/backend/src/app/admin/**` — served by the same Next.js app at **`http://localhost:3000/admin`**.
Server Components read data by calling repositories/use cases **in-process** (not via HTTP); mutations are
`"use server"` Server Actions. Styling: Tailwind (`tailwind.config.ts`), shared bits in `src/presentation/admin-ui/*`.

## 1. Authentication & session

- `/admin/login` → `adminLoginAction` reuses `LoginWithPasswordUseCase` (same as mobile), then requires ≥1 staff permission.
- Session = two httpOnly cookies: `sahl_admin_access` (15 min) and `sahl_admin_refresh` (30 d), `sameSite=lax`, `secure` in production.
- `(protected)/layout.tsx` redirects to `/admin/login` if `getAdminSession()` is null.
- **No silent refresh**: the refresh cookie is never used — admins are logged out after 15 minutes (documented limitation in `presentation/admin-session.ts`).
- Logout (`logout-action.ts`) only deletes cookies; the refresh token is **not revoked server-side**.
- Bootstrap admin: created by `prisma/seed.ts` from `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD`. There is no UI/API to create staff or assign roles.

## 2. RBAC & navigation

`src/presentation/admin-ui/nav-config.ts` — sidebar items hidden unless the session has the key.
Every page calls `requireAdminPermission(key)` and renders `ForbiddenNotice` on failure;
**every server action re-checks the permission** (verified: all 13 action files guard every exported action).

| Sidebar | Route | Permission |
|---|---|---|
| Dashboard | `/admin/dashboard` | `dashboard.view` |
| Users | `/admin/users`, `/admin/users/[id]` | `users.manage` |
| Providers | `/admin/providers`, `/admin/providers/[id]` | `providers.manage` |
| Companies | `/admin/companies`, `/admin/companies/[id]` | `companies.manage` |
| Services | `/admin/services` → `/on-demand`, `/contracts`, `/remote` | `services.manage` |
| Advertisements | `/admin/advertisements`, `/new`, `/[id]` | `advertisements.manage` |
| Notifications | `/admin/notifications`, `/new`, `/[id]` | `notifications.manage` |
| Promotions | `/admin/promotions`, `/new`, `/[id]` | `promotions.manage` |
| Remote Config | `/admin/config`, `/new`, `/[id]` | `config.manage` |
| AI Features | `/admin/ai` | `ai.manage` |
| Workflows | `/admin/workflows`, `/new`, `/[id]`, `/[id]/instances/[instanceId]` | `workflows.manage` |
| Financial Core | `/admin/finance` → withdrawals, disputes, settlements, wallets, escrows, reports | `finance.manage` |
| Audit Logs | `/admin/audit-logs` | `audit.view` |

`contracts.manage` and `remote.manage` exist (seeded) but are only used by the API `mark-paid` routes; no page uses them.

## 3. Modules — what actually works

| Module | Read | Write actions in UI | Status |
|---|---|---|---|
| Dashboard | 17 live aggregate metrics (`PrismaDashboardMetricsService`) | — | Operational (read-only) |
| Users | search list, detail | suspend (reason), reactivate | Operational — but suspension doesn't cut off existing sessions (see bugs) |
| Providers | list (filters), detail incl. documents | review verification (VERIFIED/REJECTED/NEEDS_MORE_INFO), suspend, reactivate, delete | Partial — per-document approve/reject exists only as API `PATCH /admin/providers/[id]/documents/[documentId]`, no UI button |
| Companies | list, detail incl. documents | review verification, suspend, reactivate, delete | Partial — same per-document gap |
| Services | on-demand / contract projects / remote lists | none | Read-only. Releasing a milestone payment (`POST /admin/{contracts,remote}/milestones/[id]/mark-paid`) has **no UI**; categories cannot be managed |
| Advertisements | list, detail | create, update, activate/deactivate | Operational (no creative upload; URL fields) |
| Notifications | list, detail | create broadcast, send (fans out in-app `Notification` rows) | Operational for in-app only; `scheduledFor` stored but no scheduler; no push |
| Promotions | list, detail | create, update, activate/deactivate | Operational as data; promotions are **not applied to any price** anywhere |
| Remote Config | list, detail | create, update, soft-delete (typed values) | Operational; Flutter fetches `/config` but no code reads any key |
| AI Features | 9 toggles | enable/disable + provider string | Operational as data; nothing at runtime consults toggles |
| Workflows | definitions, steps, instances | create definition, publish, archive | Data only — no engine executes workflows; instance pages will always be empty |
| Finance → Withdrawals | list (status filter), detail | approve, reject, mark paid, mark failed | Operational (verified by unit tests, not by HTTP) |
| Finance → Disputes | list, detail | resolve: release / refund / partial split | Operational (unit-tested) |
| Finance → Settlements | list | create batch from approved withdrawals, complete | Operational |
| Finance → Wallets / Escrows | lookup by id | — | Read-only lookups (no list/search) |
| Finance → Reports | trial balance, reconciliation | — | Read-only |
| Audit Logs | list with filters | — | Operational (read-only) |

## 4. Admin API (for external tools)

Every admin page has a mirrored JSON API under `/api/v1/admin/*` guarded by `requirePermission` with a Bearer
token (see [API_CONTRACTS.md](API_CONTRACTS.md) §Admin). Extras available only via API: refunds
(`POST /admin/finance/refunds`), ledger accounts/statements/journal entries, document review, milestone mark-paid.

## 5. Missing admin capabilities (vs. docs/00-admin-panel-spec.md)

- Staff & role management (create staff, assign roles/permissions)
- Service category CRUD (taxonomy, translations, required documents)
- Home layout builder (`HomeLayoutBlock`) — the mobile home screen depends on it
- Commission rules, tax rules, refund policies, payment gateway config, exchange rates
- CMS pages, popups, message templates, coupons, referrals, subscriptions/plans
- Support tickets, reports/moderation, reviews moderation
- AI provider config (`AiProviderConfig`) and AI usage logs
- Milestone payment release button, per-document review buttons
- Wallet freeze/unfreeze, ledger journal browsing UI, escrow list
- Admin session refresh; logout-side token revocation
- i18n (admin UI is English-only)
