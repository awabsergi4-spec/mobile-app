# SAHL — Roadmap

Status: Draft v1.0

## 1. Business Objectives → Delivery Phases

| Horizon (from [00-business-requirements.md](00-business-requirements.md)) | Objectives | Corresponding phase(s) below |
|---|---|---|
| **Year 1** | Leading marketplace in Sudan, thousands of verified providers, established customer trust, sustainable monetization launched | Phase 0 → Phase 2 |
| **Year 2** | Regional expansion, enterprise accounts, business APIs, AI-powered recommendations | Phase 3 |

## 2. Delivery Phases

### Phase 0 — Foundation (current)
Planning docs (this set), monorepo scaffold, backend skeleton, mobile skeleton, CI baseline ([.github/workflows/ci.yml](../.github/workflows/ci.yml) — backend lint/typecheck/test, mobile analyze/test), AI abstraction layer scaffolded ([ADR-005](02-architecture.md#9-adr-005-ai-integration-layer) — all nine `AiFeatureToggle` rows seeded disabled, `IntentClassifier` wired as the reference interface). No user-facing functionality yet.

**Production implementation status** (architecture is complete per standing instruction 2026-07-26; tracked here module-by-module rather than in a new document):

| Module | Status |
|---|---|
| Identity & Auth | **Production-ready** — register, login, OTP request/verify, refresh rotation + reuse detection, logout, fail-closed RBAC guards, unit tests. See [apps/backend/README.md](../apps/backend/README.md). |
| Provider | **Production-ready** — profile create/update, availability (mode + fast-path boolean written together), documents, payout accounts, portfolio, verification submit/review (admin), suspend/reactivate/soft-delete (admin), audit log + `DomainEvent` publishing on every state transition, unit tests. Service areas/categories/working hours and matching-score surfacing remain schema-only, owned by the Search/Matching module. |
| Company | **Production-ready** — creation (auto-provisions an OWNER `CompanyMember`), update, member invite/accept/cancel (phone-based, 7-day TTL), member role change/removal (OWNER-protected), documents, verification submit/review (admin), suspend/reactivate/soft-delete (admin), unit tests. `CompanyBranch`/`CompanyDepartment`/`CompanyContact` remain schema-only — no CRUD surface yet, not exercised by any use case. |
| On-Demand | **Production-ready** — request creation with sequential-dispatch matching (`DistanceRatingProviderMatcher`: Haversine distance + rating, writes `MatchingScoreLog`), assignment accept/decline with automatic re-offer to the next candidate, ASSIGNED→EN_ROUTE→IN_PROGRESS→COMPLETED lifecycle (accepted-provider-only), cancel (up through EN_ROUTE), tracking pings, unit tests. |
| Contract | **Production-ready** — project posting (Guest-browsable), bidding, award (creates `Contract`, rejects competing bids), milestone lifecycle (PENDING→IN_PROGRESS→SUBMITTED→APPROVED→PAID, party-scoped authorization), completion (requires all milestones PAID), cancellation, versioned document upload, unit tests. `POST /admin/contracts/milestones/{id}/mark-paid` is a manual stand-in for the `RELEASE_ESCROW` workflow action (ADR-009) until Payments exists. |
| Remote | **Production-ready** — direct customer→provider engagement creation (no bidding step), deliver/complete/cancel lifecycle, milestones (same state machine as Contract), revisions (requesting one returns a DELIVERED engagement to ACTIVE), meeting scheduling, unit tests. |
| Everything else (Financial Core, Admin Panel, Workflow Engine, Payments, Chat, ...) | Schema + interfaces designed (ADR-001–009), application/infrastructure/presentation layers not yet implemented. |

`requirePermission` (RBAC) is exercised end-to-end by the Provider, Company, Contract, and Remote admin routes (`providers.manage` / `companies.manage` / `contracts.manage` / `remote.manage` permission keys). `/users/me` still only needs `requireAuth`.

**Backend integration audit (2026-08-01)**: the "production-ready" rows above had previously been verified by unit tests and manual review only — Node.js wasn't available earlier in the project. With Node.js now available, `npm install`, `tsc --noEmit`, `eslint`, `vitest run`, and `next build` were run for real (not simulated) across all 93 models / 61 enums and all 65 API routes; all now pass. The audit found and fixed real bugs: two modules importing an entity type from the wrong module (`Contract`/`RemoteEngagement` from `.repository` instead of `.entity` — a `tsc` error, not previously caught since typecheck had never actually run), two TOCTOU race conditions (concurrent contract-bid award, concurrent on-demand assignment accept/decline — fixed with atomic conditional-update repository methods), a missing terminal-state guard letting a soft-deleted Provider/Company be resurrected via suspend/reactivate, a provider-eligibility gap letting a suspended/unverified provider bid on and be awarded Contracts or engaged directly for Remote work, two admin financial routes that discarded the actor's identity instead of audit-logging it, and a missing `eslint.config.js` that meant `npm run lint` had never actually run. See git history for the full fix list.

### Phase 1 — MVP Launch (matches brief's "free launch" business model)
- Identity: registration, OTP, login, profile (photo, bio, languages, address/GPS, notification/privacy preferences), role duality (customer default, provider activation).
- Provider profile: business details, working hours, portfolio/gallery, skills, emergency availability, coverage area — verification documents (national ID, license, tax, certificates) reviewed through the same `ProviderDocument` queue.
- Taxonomy seeded for all three service types, with Primary/Secondary category + Skill Level/Verification Level/Location Requirement/Duration Class attributes populated for search and matching pre-filters.
- **On-Demand**: request creation (instant + scheduled fulfillment modes, see [ADR-003](02-architecture.md#7-adr-003-scheduled-service-is-a-booking-mode-of-on-demand-not-a-fourth-bounded-context); emergency flag), matching engine v1 (weighted scoring incl. current workload + emergency status, rule-based intent classification), assignment offer/accept, live tracking, chat (text/image/voice/file/location), completion, review (overall + category sub-ratings + photos), favorites.
- **Contract**: project posting, bidding, award, milestones (manual status progression), documents, chat.
- **Remote**: engagement creation, milestones, revisions, chat; video meetings deferred until provider is chosen (open item in [02-architecture.md](02-architecture.md) §15).
- **Financial Core** ([ADR-008](02-architecture.md#12-adr-008-financial-core-double-entry-ledger-architecture), [09-financial-core.md](09-financial-core.md)) — the ledger (`LedgerAccount`/`JournalEntry`/`JournalLine`), bucketed `WalletBalance`, `Escrow`, and `PaymentTransaction` ship in Phase 1, not later: escrow hold/release is how On-Demand/Contract/Remote payments already work end-to-end (see the sequence diagram in [09-financial-core.md](09-financial-core.md) §4), so it can't be a Phase 2 add-on. Wired to a single payment gateway for the seeded `Region`; commission engine present but `CommissionRule.isActive = false` (free launch); referral rewards live from day one (`ReferralCode`/`ReferralRedemption`) since it's a launch-phase growth lever, not a Phase 2 feature. `TaxRule`/`RefundPolicy` seeded with permissive defaults (no tax, generous refund window) rather than left unmodeled, since retrofitting tax logic into live transactions later is far riskier than starting with a working-but-lenient default.
- Trust & safety: favorites, support tickets, disputes (with evidence upload), reports, risk score/blacklist fields on `User` — basic staff triage in admin console.
- Admin console: verification queue, moderation (listings + reports), finance ops, support/dispute triage, audit log viewer.
- **Platform Control Center foundation** ([ADR-007](02-architecture.md#11-adr-007-admin-panel-as-platform-control-center)) — this ships in Phase 1, not later, because "no app release for content/config changes" needs to be true from launch, not retrofitted: `RemoteConfigEntry` + `GET /config` (feature flags, maintenance mode, min/max app version, rate/upload limits — the mobile app fetches these on cold start rather than hardcoding them); `CmsPage` for the App Store/Play Store–required pages (Terms, Privacy, About, Contact, FAQ); `HomeLayoutBlock` + a Flutter block-type registry (`lib/core/remote_config/`) so the home screen renders from backend-defined blocks, not a hardcoded layout — the admin drag-and-drop *builder UI*, scheduling, country/city targeting, and A/B testing are Phase 2, but the rendering seam exists from day one so Phase 2 is a UI build, not a re-architecture.
- **Workflow Engine foundation** ([ADR-009](02-architecture.md#13-adr-009-workflow-engine-as-a-cross-entity-orchestration-layer), [10-workflow-engine.md](10-workflow-engine.md)) — the milestone-completion sequence (approve-or-timeout → `RELEASE_ESCROW` → notify both parties) ships in Phase 1 because it's how Contract/Remote milestone payments actually release funds, not optional infrastructure: `DomainEvent` publishing (`ReleaseEscrowUseCase` already emits `EscrowReleased`), the `workflowQueue` BullMQ worker, and `RELEASE_ESCROW`/`SEND_MESSAGE` action executors. The admin Workflow Builder UI, `AutomationRule` scheduled scans, and the remaining 12 action-type executors are Phase 2 — the schema and the one worked example exist from Phase 1.
- Security baseline per [05-security.md](05-security.md).
- Arabic + English, RTL/LTR, light/dark.
- Business/Company Accounts (`Company`/`CompanyMember`) backend API shipped ahead of schedule in Production Phase 1.2 (creation, membership, invitations, verification, lifecycle) — see the production implementation status table above. Company-attributed bulk requests/projects, company wallet UI, and company analytics remain Phase 3.

**Exit criteria**: all three service types (plus scheduled On-Demand bookings) functional end-to-end for Sudan/SDG, with real payment gateway integration (even if commission is off), and Year 1's "thousands of verified providers" / "established customer trust" objectives instrumented via the metrics in §3.

### Phase 2 — Monetization (completes Year 1)
- Enable `CommissionRule` per category.
- `PromotionalCampaign`, `Advertisement` (now with `adType`/budget/targeting/`AdEvent` click-and-conversion tracking), and `Coupon` activated (`isActive: true`) — sponsored/featured providers, promotional discounts, code-redeemed coupons.
- Premium subscriptions (provider "premium accounts") and verification badges — `SubscriptionPlan`/`Subscription` schema exists from Phase 1 ([ADR-008](02-architecture.md#12-adr-008-financial-core-double-entry-ledger-architecture)); this phase activates plans (`SubscriptionPlan.isActive = true`) and builds the upgrade/downgrade/cancel UI + renewal billing job.
- Settlement Engine and Withdrawal Engine full build-out: batch `Settlement` runs on a configurable `SettlementSchedule`, the withdrawal approval-workflow admin UI, daily/monthly withdrawal limits enforced via `RemoteConfigEntry`. The schema and state machines exist from Phase 1 ([09-financial-core.md](09-financial-core.md) §3) — this is the operator-facing surface and the batch-processing job.
- Provider analytics dashboard (uses `MatchingScoreLog` + completed job history already being captured since Phase 1).
- Platform Control Center, full build-out: the drag-and-drop Home Builder admin UI (reordering, scheduling, targeting, A/B group labeling, preview-before-publish), Notification Center (`NotificationBroadcast`, fanning out to per-user `Notification` rows), Popup Management (`PopupCampaign`), `MessageTemplate`-driven email/SMS/push copy, and the configurable per-`StaffRole` admin Dashboard (`AdminDashboardWidgetPreference`) with the widgets whose data sources exist by this phase (Revenue, Orders, Pending Verifications, Open Disputes, Wallet Balance, Search Trends). Widgets depending on Phase 3 systems (AI Usage, Queue Status once background jobs are processing, System/API Health once ops monitoring is built) land when those systems do, not before.
- Workflow Engine, full build-out ([10-workflow-engine.md](10-workflow-engine.md) §7): the admin Workflow Builder UI (create/version/clone/test/publish), `AutomationRule` scheduled-scan jobs for the spec's named rules (provider inactivity, withdrawal threshold, dispute escalation, milestone-overdue notice), and the remaining `WorkflowActionType` executors (`CREATE_ESCROW`, `CREATE_WALLET_TRANSACTION`, `ASSIGN_PROVIDER`, `AI_EVALUATION`, `FRAUD_CHECK`, `CREATE_AUDIT_LOG`, `SCHEDULE_JOB`, `CALL_EXTERNAL_API`, `CREATE_ADMIN_TASK`, `ESCALATE_CASE`, `GENERATE_REPORT`) added as each is first invoked by a real workflow. `GENERATE_CONTRACT` follows once award-to-contract is itself workflow-driven; `GENERATE_INVOICE` waits on the `Invoice` entity decision (still deferred, [03-database-schema.md](03-database-schema.md) §4).

### Phase 3 — Enterprise & Scale (Year 2)
- Business Accounts (`Company`/`CompanyMember`, [ADR-004](02-architecture.md#8-adr-004-businesscompany-accounts-extend-identity-they-dont-fork-it)): company creation/member management/invitations/verification shipped early in Production Phase 1.2 (see status table above); this phase adds company-attributed bulk requests and projects, company wallet, and company analytics on top of that existing API.
- Public API access, advanced analytics subscriptions, marketplace integrations.
- Additional `Region` rows (new, neighboring country) — validates the multi-country abstraction built in Phase 0/1 actually holds without redesign.
- First real (non-rule-based) `domain/ai/*` implementations land here, each flipped on independently via `AiFeatureToggle` — no phase is blocked on "AI" as a monolith:
  - `RankingAdjuster`: learned ranking model trained on accumulated `MatchingScoreLog` data (see [06-smart-matching.md](06-smart-matching.md) §6).
  - `RecommendationProvider`, `FraudSignalProvider`, `DemandForecastProvider`, `PricingSuggestionProvider`.
  - `ConversationalAssistant` for the customer/provider/admin personas (three `AiFeatureToggle` rows, one interface — [ADR-005](02-architecture.md#9-adr-005-ai-integration-layer)).
- AI Management admin UI (`/admin/ai`): toggle capabilities, select `AiProviderConfig` entries/models/prompts, view `AiUsageLog` cost/usage — the schema (`AiFeatureToggle`, `AiProviderConfig`, `AiUsageLog`) exists from Phase 0/1, this is the operator-facing surface over it.
- Plugin Architecture ([ADR-007](02-architecture.md#11-adr-007-admin-panel-as-platform-control-center) §"Plugin Architecture is not a new mechanism"): additional `PaymentProvider`/`StorageProvider`/`AIProvider` adapters (a second payment gateway for a new `Region`, Anthropic/Gemini/local-LLM per ADR-006, an SMS/email provider) added opportunistically as each becomes concrete — not a discrete milestone, since the mechanism already exists and adding a vendor is additive by design.

## 3. Success Metrics & Instrumentation

From [00-business-requirements.md](00-business-requirements.md): MAU/DAU, Verified Providers, Completed Orders, Average Response Time, Customer/Provider Satisfaction, Average Rating, Revenue, Retention Rate, Conversion Rate, Dispute Resolution Time, Support Response Time, Payment Success Rate, Referral Growth.

| Metric | Data source (already modeled) |
|---|---|
| Verified Providers | `ProviderProfile.verificationStatus = VERIFIED`, count |
| Completed Orders | `OnDemandRequest`/`Contract`/`RemoteEngagement` rows in a `COMPLETED` status |
| Average Response Time | `ProviderProfile.avgResponseSeconds`, aggregated |
| Average Rating / Satisfaction | `Review.rating`, aggregated per subject |
| Revenue | `PaymentTransaction` where `type IN (COMMISSION)`, summed |
| Dispute Resolution Time | `Dispute.createdAt` → `resolvedAt` |
| Support Response Time | `SupportTicket.createdAt` → first `SupportTicketMessage` from staff |
| Payment Success Rate | `PaymentTransaction.status = SUCCEEDED` ÷ total attempts |
| Referral Growth | `ReferralRedemption` count over time |
| MAU/DAU, Retention, Conversion | need session/event tracking, not yet modeled — an analytics/event-log pipeline is an explicit Phase 2 build item, not assumed to exist already |

## 4. Standing Open Items (must be resolved with the user, not assumed)

| Item | Blocks | Status |
|---|---|---|
| Payment gateway for Sudan (`SD` / `SDG`) | Phase 1 payments integration | Not selected |
| Video meeting provider for Remote services | Full Remote-service feature parity | Not selected |
| RPO/RTO targets for backups/DR | Ops runbook finalization | Not set |
| Admin web console: same Next.js app vs. separate app | Phase 1 admin build | Default assumption documented in [02-architecture.md](02-architecture.md) §15, revisit if needed |
| Install Node.js, run `npm install` to generate `apps/backend/package-lock.json`, switch CI from `npm install` to `npm ci` | Reproducible backend builds, faster CI | Not done — this machine has no Node.js (see [apps/backend/README.md](../apps/backend/README.md)) |
| Bundle Inter/IBM Plex Sans Arabic/Cairo as font assets instead of runtime `google_fonts` fetch | Offline-first support, first-run UX without network | Not done — tracked in [08-design-system.md](08-design-system.md) §3 |
| Small-text color-contrast audit against brand orange (`#F57C00`) | Accessibility sign-off before real screens ship | Not done — tracked in [08-design-system.md](08-design-system.md) §6 |
| Actual VAT/sales tax rate and refund-window policy for Sudan | Real `TaxRule`/`RefundPolicy` seed data (placeholder permissive defaults ship in Phase 1 — see [09-financial-core.md](09-financial-core.md)) | Not set — needs real legal/tax guidance, not guessed |
| Chart-of-accounts sign-off (exact `LedgerAccount` codes/names) with whoever owns SAHL's actual bookkeeping/compliance | Trial Balance produced by [ADR-008](02-architecture.md#12-adr-008-financial-core-double-entry-ledger-architecture) reflects real accounting practice, not an engineering guess | Not done — the account codes in ADR-008 are illustrative |

## 5. Review Checklist (applied per feature before calling it done)

Every feature is checked against the platform philosophy ([01-product-overview.md](01-product-overview.md) §10) before merge. [00-functional-requirements.md](00-functional-requirements.md)'s four-requirements bar ("easy to understand, fast to use, secure by default, scalable without architectural changes") is the same bar under different words — folded into one checklist below rather than tracked separately:

- [ ] Simple / easy to understand: does this need to exist, or is a smaller version sufficient for the current phase?
- [ ] Fast / fast to use: does it hit the latency-sensitive paths correctly (Redis-backed where required, e.g. On-Demand matching), within the NFR targets in [02-architecture.md](02-architecture.md) §14?
- [ ] Secure / secure by default: authz check present (customer/provider, staff RBAC, *and* company membership where relevant — see [04-api-modules.md](04-api-modules.md) §3), input validated, sensitive fields not leaked in DTOs, audit-logged if it's a sensitive action.
- [ ] Localized: no hardcoded UI strings; RTL verified, not just LTR-with-mirroring assumed.
- [ ] Scalable without architectural changes: no design decision that only works for one country/currency/language/gateway, and no design decision that only works for an individual actor when a company-attributed variant is foreseeable.
- [ ] Testable: domain/application logic covered by tests without requiring a live DB.
- [ ] AI-ready (standing instruction, 2026-07-26 — see [ADR-005](02-architecture.md#9-adr-005-ai-integration-layer)): if this feature produces a decision, a score, or a significant state transition, is it persisted in a structured, queryable form (not an opaque blob) so a future `domain/ai/*` implementation could consume it? Does any new AI-adjacent capability go through a `domain/ai/` interface + `AiFeatureToggle`, never a direct SDK import into application/domain code?

**For any screen** (mobile UI work specifically), the [00-ui-ux-design-system.md](00-ui-ux-design-system.md) Design Quality Checklist is a hard merge gate, not a suggestion: consistent spacing (`AppSpacing`), Material 3 compliance, Arabic + English support, RTL/LTR compatibility, light/dark compatibility, accessible color contrast, responsive layout, fast rendering, smooth animations (`AppMotion`), clear visual hierarchy, minimal cognitive load, professional appearance — see [08-design-system.md](08-design-system.md) for the token implementation. A screen with no meaningful empty/error/loading state (per the design spec) is not done, even if the happy path works.
