# SAHL Backend

Next.js + TypeScript + Prisma API, built with Clean Architecture layering. See [../../docs/02-architecture.md](../../docs/02-architecture.md) for the full rationale.

## Layout

```
src/
├── domain/          # entities, value objects, repository interfaces — framework-free
├── application/      # use cases, orchestrate domain via repository interfaces
├── infrastructure/    # Prisma repos, Redis, Cloudinary, payment adapters, argon2, etc.
└── app/api/v1/**       # Next.js route handlers (presentation layer)
```

## Identity & Auth — production-ready (Production Phase 1)

Full authentication flow, not a scaffold: register, login (phone+password), OTP request/verify (also used for phone verification and OTP-based login), refresh with rotation + reuse detection, logout, and fail-closed RBAC — see [`domain/identity`](src/domain/identity), [`application/identity`](src/application/identity), [`infrastructure/identity`](src/infrastructure/identity), [`presentation/auth-guards.ts`](src/presentation/auth-guards.ts), routes under [`app/api/v1/auth`](src/app/api/v1/auth) and [`app/api/v1/users/me`](src/app/api/v1/users/me/route.ts) (the reference protected route). Unit tests: [`application/identity/__tests__`](src/application/identity/__tests__).

This is the reference for how every other module gets built out in Production Phase 1: domain interface → application use case → infrastructure implementation → presentation route, with real logic at every layer (no stubs) and hand-written fakes for tests rather than a mocking library, since every interface here is small enough that a fake is clearer.

## Provider & Company — production-ready (Production Phase 1.2)

Both bounded contexts follow the Identity reference exactly, reusing ADR-004 (Company wraps Identity), ADR-008 (audit trail), and ADR-009 (`DomainEvent` publishing on every state transition — `ProviderVerificationSubmitted`/`Reviewed`, `ProviderSuspended`/`Reactivated`/`Deleted`, and the `Company*` equivalents).

- **Provider** — [`domain/provider`](src/domain/provider), [`application/provider`](src/application/provider), [`infrastructure/provider`](src/infrastructure/provider), routes under [`app/api/v1/providers`](src/app/api/v1/providers) and [`app/api/v1/admin/providers`](src/app/api/v1/admin/providers). Profile CRUD, availability (mode + fast-path boolean written together, never independently), documents + payout accounts + portfolio, verification submit (requires ≥1 document) → admin review, suspend/reactivate/soft-delete. Unit tests: [`application/provider/__tests__`](src/application/provider/__tests__).
- **Company** — [`domain/company`](src/domain/company), [`application/company`](src/application/company), [`infrastructure/company`](src/infrastructure/company), routes under [`app/api/v1/companies`](src/app/api/v1/companies) and [`app/api/v1/admin/companies`](src/app/api/v1/admin/companies). Creation auto-provisions an OWNER `CompanyMember`; phone-based invitations (7-day TTL) accepted by phone match, not by account lookup; member role changes/removal enforce OWNER-protection and OWNER/MANAGER-only authorization via [`presentation/company-guards.ts`](src/presentation/company-guards.ts) — a company-scoped authorization axis, independent of the platform `StaffRole` RBAC used by `/admin/**`. Unit tests: [`application/company/__tests__`](src/application/company/__tests__).

Not yet built: `CompanyBranch`/`CompanyDepartment`/`CompanyContact` CRUD (schema exists, no use case yet), and provider service areas/categories/working hours (owned by the upcoming Search/Matching module).

## Services Module — production-ready (On-Demand, Contract, Remote)

The three service-delivery bounded contexts, same layering and quality bar as Identity/Provider/Company:

- **On-Demand** — [`domain/on-demand`](src/domain/on-demand), [`application/on-demand`](src/application/on-demand), [`infrastructure/on-demand`](src/infrastructure/on-demand), routes under [`app/api/v1/on-demand`](src/app/api/v1/on-demand). Sequential-dispatch matching via the `ProviderMatcher` interface — [`DistanceRatingProviderMatcher`](src/infrastructure/on-demand/distance-rating-provider-matcher.ts) is the v1 rule-based implementation (Haversine distance + rating, writes `MatchingScoreLog`), swappable later for a learned ranking model without touching the use cases (same shape as `domain/ai`'s capability interfaces). Declining an offer automatically re-matches and re-offers to the next candidate.
- **Contract** — [`domain/contract`](src/domain/contract), [`application/contract`](src/application/contract), [`infrastructure/contract`](src/infrastructure/contract), routes under [`app/api/v1/contracts`](src/app/api/v1/contracts). Post → bid → award (creates the `Contract`, rejects competing bids) → milestones (party-scoped state machine: provider drives IN_PROGRESS/SUBMITTED, customer drives APPROVED, admin/system drives PAID) → completion (requires all milestones PAID).
- **Remote** — [`domain/remote`](src/domain/remote), [`application/remote`](src/application/remote), [`infrastructure/remote`](src/infrastructure/remote), routes under [`app/api/v1/remote`](src/app/api/v1/remote). Direct customer→provider engagement (no bidding step); same milestone state machine as Contract; revisions (requesting one on a DELIVERED engagement returns it to ACTIVE); meeting scheduling.

All three publish `DomainEvent`s on every state transition (ADR-009) and reuse `presentation/on-demand-guards.ts` / `contract-guards.ts` / `remote-guards.ts` for party-scoped authorization (is this caller the customer or the assigned/awarded/engaged provider) — a different axis from the platform `StaffRole` RBAC used by `/admin/**`. Unit tests: `application/{on-demand,contract,remote}/__tests__`.

Not yet built: escrow/payment wiring (milestone PAID transitions are manual admin calls standing in for a future `RELEASE_ESCROW` workflow action — Payments module doesn't exist yet), and Contract/Remote documents don't yet route through a real storage adapter (accept an already-uploaded `fileUrl`, same pattern as Provider/Company documents).

Run the identity unit tests:

```bash
npm test
```

## Setup

Requires Node.js 20+ (not installed on this machine at scaffold time — install it before running anything below).

```bash
npm install
cp .env.example .env   # fill in real values
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Seed the default region (Sudan), starter categories, and AI feature toggles (all off by default):

```bash
npx prisma db seed
```

## Realtime service

Socket.IO runs as a separate process from the Next.js API per [ADR-002](../../docs/02-architecture.md#adr-002-realtime-service-is-decoupled-from-the-api). Skeleton at [`src/realtime/server.ts`](src/realtime/server.ts) (JWT-authenticated connections, Redis adapter wired, no event handlers beyond `conversation:join` yet).

```bash
npm run realtime:dev
```

## AI layer

Two layers, per [ADR-005](../../docs/02-architecture.md#9-adr-005-ai-integration-layer) and [ADR-006](../../docs/02-architecture.md#10-adr-006-ai-provider-abstraction):

- **Capability layer** — nine future AI capabilities (matching, NL search, recommendations, fraud detection, demand forecasting, dynamic ranking, pricing suggestions, and three assistants) as business-shaped interfaces in [`domain/ai`](src/domain/ai). Every interface has a no-AI-required default in [`infrastructure/ai/rule-based`](src/infrastructure/ai/rule-based); [`infrastructure/ai/registry.ts`](src/infrastructure/ai/registry.ts) resolves which implementation is active per `AiFeatureToggle` row, so enabling/replacing/disabling a capability is a config change, not a code change.
- **Provider layer** — [`domain/ai/provider/ai-provider.ts`](src/domain/ai/provider/ai-provider.ts)'s `AIProvider` is the vendor-agnostic seam underneath any LLM-backed capability implementation: text generation, embeddings, intent classification, structured JSON, and optional (declared, not mandatory) image/speech methods for later. [`infrastructure/ai/providers/openai-compatible-provider.ts`](src/infrastructure/ai/providers/openai-compatible-provider.ts) is the first adapter (covers OpenAI itself plus any OpenAI-wire-compatible endpoint — Azure, Groq, local vLLM/Ollama). [`infrastructure/ai/providers/ai-provider-registry.ts`](src/infrastructure/ai/providers/ai-provider-registry.ts) resolves a `FailoverAIProvider` chain from `AiProviderConfig` rows in priority order — a config change, not a code change, adds a vendor or reorders failover.

`IntentClassifier` is wired end-to-end through both layers as the reference: `AiFeatureToggle.provider === "rule-based"` → `KeywordIntentClassifier`; anything else → `LlmIntentClassifier` ([`infrastructure/ai/llm`](src/infrastructure/ai/llm)) built on an `AIProvider` from `AiProviderRegistry`. The other five capability interfaces follow the identical shape once they get real implementations.
