# SAHL — Security

Status: Draft v1.0

## 1. Authentication & Session Security

- **Password hashing: argon2id is the official, final algorithm for SAHL** (memory-hard, GPU-resistant) — never SHA/MD5/plain bcrypt-only. This decision is closed, not a placeholder: [00-system-architecture.md](00-system-architecture.md) named BCrypt in the original brief, and the project owner has explicitly overridden that in favor of argon2id (2026-07-26) — this line is the canonical spec going forward, superseding the source brief's mention. Implemented in `Argon2PasswordHasher` ([apps/backend](../apps/backend/src/infrastructure/identity/argon2-password-hasher.ts)). Rationale kept for context: OWASP's current password-storage guidance lists Argon2id as the first-choice algorithm, with bcrypt an acceptable fallback only when Argon2 isn't available; bcrypt also silently truncates input at 72 bytes and has no independently-tunable memory cost, which argon2id fixes.
- Access tokens: short-lived JWT (target ~15 min), signed with an asymmetric key (RS256) so the realtime service can verify tokens without holding the signing secret.
- Refresh tokens: opaque random value, stored server-side only as a hash, rotated on every use (reuse of a revoked refresh token immediately revokes the whole token family — signals possible theft).
- OTP: 6-digit, hashed at rest, short expiry, capped verification attempts, purpose-scoped (login vs. sensitive-action step-up are different purposes so one can't be replayed as the other).

## 2. Authorization

- RBAC for staff roles and company membership (see [04-api-modules.md](04-api-modules.md) §3), ownership checks for customer/provider actions — every use case validates "does the caller own/participate in this entity" before executing, at the application layer, not just at the route.
- Admin routes, and company-scoped routes, fail closed: missing/ambiguous permission or membership → deny, never default-allow.
- Guest access is an explicit allow-list of unauthenticated `GET` routes (see [04-api-modules.md](04-api-modules.md) §2), not a default — every new route starts authenticated-only until deliberately added to the allow-list.

## 3. API Hardening

- Input validation (Zod schemas from `packages/shared`) on every request body/query — reject unknown fields, not just check required ones.
- Output shaping: DTOs at the presentation layer control exactly which fields leave the API — domain entities are never serialized directly, so adding an internal field to an entity can't accidentally leak it.
- Rate limiting per [04-api-modules.md](04-api-modules.md) §5.
- CORS restricted to known origins (mobile app via native HTTP, admin web origin) — no wildcard.
- Webhook endpoints (payment gateway callbacks) verify provider signatures before processing; replay protection via idempotency keys.
- CSRF: the mobile API is Bearer-token auth with no cookies, so classic CSRF doesn't apply there. It does apply to the admin web console if/when it uses a cookie-based session (see [02-architecture.md](02-architecture.md) §15 open question on the admin console) — a `SameSite=Strict` cookie plus a CSRF token on state-changing admin requests is required at that point, not assumed to be unnecessary just because the mobile side doesn't need it.

## 4. Data Protection

- PII and payment-adjacent fields (bank/payout details, national ID numbers on `ProviderDocument`) encrypted at rest at the application layer (envelope encryption), not relying on disk-level encryption alone.
- `PaymentGatewayConfig.config` (gateway credentials) and `AiProviderConfig.config` (AI vendor API keys/endpoints, [ADR-006](02-architecture.md#10-adr-006-ai-provider-abstraction)) encrypted at rest; never logged.
- Secrets (DB URL, JWT signing key, gateway credentials, AI provider API keys, FCM key) come from environment/secret manager, never committed — `.env.example` documents required keys with placeholder values only.

## 5. Audit Logging

- `AuditLog` (see [03-database-schema.md](03-database-schema.md)) is written by the application layer for: staff role changes, provider verification decisions, withdrawal approvals, commission rule changes, account suspensions, moderation actions. This is a domain concern, not an afterthought bolted on via request-logging middleware — it captures *who did what to which entity*, not just *which endpoint was hit*.
- Audit log is append-only (no update/delete use case exists for it).
- Financial Core specifics (immutable `PaymentTransaction`/`JournalEntry` rows, maker-checker on manual `ADJUSTMENT`/`PENALTY` transactions, fraud-detection hooks on withdrawal approval and large deposits/refunds) are covered in [09-financial-core.md](09-financial-core.md) §6, per [ADR-008](02-architecture.md#12-adr-008-financial-core-double-entry-ledger-architecture) — not duplicated here.

## 6. Fraud & Abuse Prevention (MVP-level; AI-assisted detection is a future feature per [00-master-prompt.md](00-master-prompt.md) §Future AI Features)

- Velocity checks: new-account request/bid volume limits until verification.
- Provider verification gating: unverified providers can operate with reduced visibility in matching (see [06-smart-matching.md](06-smart-matching.md)) rather than being blocked outright, balancing trust with the free/low-friction launch model.
- Duplicate-device/duplicate-payment-method heuristics flagged for manual review, not auto-banned, to avoid false-positive harm during MVP.
- These MVP heuristics are exactly the seam [ADR-005](02-architecture.md#9-adr-005-ai-integration-layer)'s `FraudSignalProvider` plugs into later: the application layer already calls out to "evaluate this entity for fraud risk" as a distinct step, so swapping the rule-based heuristics above for a real `FraudSignalProvider` implementation is a registry config change (`AiFeatureToggle.capability = FRAUD_DETECTION`), not a rewrite of the moderation/velocity-check call sites.

## 7. Backups & Disaster Recovery

- PostgreSQL: automated daily full backup + continuous WAL archiving, restore drills scheduled quarterly once in production (tracked as an ops runbook, not just a policy statement).
- Cloudinary assets: provider's own redundancy relied on for storage durability; DB retains the canonical URL/metadata so a Cloudinary-side issue doesn't lose referential state.
- Defined RPO/RTO targets are an open item — to be set with real infra during the DevOps setup phase, not guessed here.

## 8. Compliance Note

Country-specific data protection / consumer protection requirements (data residency, payment regulation) depend on the target country, which is currently a placeholder (see [ADR-001](02-architecture.md#adr-001-locale--payment-abstraction)). This must be revisited with actual legal requirements once the target country is confirmed — not assumed away.
