# Launch Readiness

Bottom line (2026-11-14): **not launchable.** The codebase is well-structured, compiles, and has solid
unit-tested domain logic, but no complete customer→provider→payment journey can be performed from the
mobile app, money handling is mock-only and non-atomic, and nothing has been verified over HTTP or on a device.

## 1. Genuinely ready (code-complete, unit-tested, builds)

- Backend layering, envelope, validation, RBAC model, party/company guards.
- Auth core: register, password login, OTP verify, refresh rotation with reuse detection, logout.
- Ledger with balanced-entry invariant; escrow claim logic; withdrawal & settlement lifecycle; dispute resolution.
- Company membership/invitations; provider profile/availability/documents/portfolio/payout accounts.
- Contract bidding/award and remote engagement creation.
- Admin Platform: login, RBAC sidebar, dashboard metrics, users/providers/companies moderation,
  finance operations (withdrawals, disputes, settlements, reports), ads, promotions, broadcasts, remote config, audit log.
- Flutter foundation: networking, token refresh, routing/redirects, ar/en localization, theming, error handling.

## 2. Launch blockers (must fix)

| # | Blocker | Ref |
|---|---|---|
| 1 | Suspended users retain access (no token revocation / status check) | B-01 |
| 2 | Money movements not wrapped in DB transactions | B-02 |
| 3 | OTP verification breaks for `+`-prefixed phone numbers in the app | B-03 |
| 4 | On-demand matching cannot find providers (no provider categories/service areas) | B-04 |
| 5 | No "become provider" / "create company" in the app | B-05 |
| 6 | Mock payment gateway is the only gateway; public mock webhook secret | B-06, B-07 |
| 7 | On-demand has no price or payment at all | FEATURE_STATUS |
| 8 | Contract/Remote lifecycle actions (fund, milestone status, deliver, complete) missing from app; payout release has no admin button | FEATURE_STATUS |
| 9 | Money unit mismatch app vs admin | B-08 |
| 10 | Cancelling with funded escrow strands money | B-09 |
| 11 | Real SMS OTP delivery | ENVIRONMENT §8 |
| 12 | File upload (documents are required for verification) | Incomplete integrations |
| 13 | Home screen is empty: no admin editor for home blocks, 0 rows | FEATURE_STATUS |
| 14 | No deployment target, HTTPS, production env, or release signing | ENVIRONMENT |

## 3. Needs real credentials / accounts

SMS provider · payment gateway (card and/or Sudanese mobile money) · object storage (Cloudinary or S3) ·
Firebase project (FCM, `google-services.json`, APNs) · Google Maps/Places key (if maps are adopted) ·
Android upload keystore + Play Console · production PostgreSQL & Redis · domain + TLS certificate ·
production JWT keypair and `SEED_ADMIN_*` values.

## 4. Needs device / end-to-end testing

- Full registration → OTP → login on Android emulator and a physical device (Arabic RTL + English).
- Token expiry/refresh under real 15-minute TTL; logout/login account switching (stale data).
- Every Flutter screen against a live backend (none were exercised in this audit).
- Admin flows over a real DB: verification review, withdrawal approve→paid, dispute resolution, reports reconcile.
- Webhook signature verification with the real gateway.
- Concurrency: double-submit on fund/release/withdraw.

## 5. Prioritised launch checklist

**P0 — correctness & security**
1. Revoke tokens on suspension; enforce `ACTIVE` on refresh (B-01).
2. Transaction boundary for all finance use cases (B-02); escrow handling on cancel (B-09).
3. Disable mock gateway/webhook in production (B-06/B-07).
4. Fix OTP phone encoding (B-03) and money units (B-08).

**P1 — make the core journeys possible**
5. Provider onboarding in app (`POST /providers`) + provider categories & service areas (API + UI) (B-04/B-05).
6. Company creation in app.
7. App UI for milestone fund/status, deliver/complete, on-demand job status; admin button for milestone payout release.
8. On-demand pricing model (quote/accept or fixed price) and payment/escrow path.
9. File upload endpoint + storage adapter; use it for documents/portfolio.
10. Home layout admin editor (or remove the dynamic home dependency) and service-category admin CRUD.

**P2 — production integrations**
11. SMS OTP sender adapter.
12. Real payment gateway adapter + webhooks.
13. Transactional in-app notifications (+ FCM push).
14. Schedulers/workers: escrow expiry, scheduled on-demand dispatch, scheduled broadcasts.
15. Deployment: hosting, HTTPS, env management, release signing, staging environment, `.gitignore` for `*.pem`, git repository.

**P3 — quality**
16. HTTP-level integration tests against a test DB; Flutter repository tests with JSON fixtures.
17. Shared route handler wrapper (auth + error mapping + JSON parse errors).
18. Pagination in app lists; locale persistence; Hive init or removal.
19. Chat, reviews/ratings, search — as product scope requires.
