# API Contracts (`/api/v1`)

Base: `http://<host>:3000/api/v1`. Extracted from `apps/backend/src/app/api/v1/**/route.ts` and
`packages/shared/schemas/*.ts`; Flutter usage from `apps/mobile/lib/features/*/data/*_repository_impl.dart`.

## Conventions

- **Success**: `{ "success": true, "message": string|null, "data": <T>, "pagination"?: {cursor,limit}, "metadata"?: {} }` (pagination is never actually populated today).
- **Error**: `{ "success": false, "errorCode": "UPPER_SNAKE", "message": string, "details"?: any, "traceId": uuid, "timestamp": iso }`.
  Validation errors: `400 VALIDATION_ERROR`, `details` = Zod `flatten()`. Unhandled errors and malformed JSON → plain Next.js 500 (no envelope).
- **Auth** column: `—` public · `JWT` = `Authorization: Bearer <accessToken>` · `perm:x` = JWT + staff permission `x`.
- Common auth errors: `401 UNAUTHENTICATED`, `403 FORBIDDEN` / `Missing required permission`.
- Money fields are **integer minor units**. Dates are ISO strings. IDs are cuid strings.
- Lists return a bare array in `data`; where supported, `?cursor=<lastId>&limit=<n>` (default 25–50).
- **Flutter** column: ✅ called by the app · ❌ not called.

## 1. Auth & user

| Method | Path | Auth | Body (Zod schema) | Success | Flutter |
|---|---|---|---|---|---|
| POST | /auth/register | — | `registerUserSchema` {phone(8–16), password(8–72), fullName(2–120), preferredLanguage:"en"\|"ar"} | 201 {id, phone, status} · 409 PHONE_ALREADY_REGISTERED · 500 REGION_NOT_SEEDED | ✅ |
| POST | /auth/login | — | {phone, password, deviceInfo?} | 200 {accessToken, refreshToken} · 401 INVALID_CREDENTIALS · 403 ACCOUNT_NOT_ACTIVE | ✅ |
| POST | /auth/otp/request | — | {phone, purpose: PHONE_VERIFICATION\|EMAIL_VERIFICATION\|LOGIN\|PASSWORD_RESET\|SENSITIVE_ACTION} | 202 {otpId} · 404 USER_NOT_FOUND · 429 OTP_REQUESTED_TOO_SOON | ✅ |
| POST | /auth/otp/verify | — | {phone, code(6), purpose, deviceInfo?} | 200 {outcome:"verified"} or {outcome:"session", accessToken, refreshToken} (LOGIN) · 400 OTP_INVALID · 429 OTP_ATTEMPTS_EXCEEDED | ✅ |
| POST | /auth/refresh | — | {refreshToken, deviceInfo?} | 200 {accessToken, refreshToken} · 401 INVALID_REFRESH_TOKEN / REFRESH_TOKEN_REUSE_DETECTED | ✅ (interceptor) |
| POST | /auth/logout | — | {refreshToken} | 200 {loggedOut:true} | ✅ |
| GET | /users/me | JWT | — | {id, phone, email, fullName, preferredLanguage, status, profilePictureUrl, createdAt, providerProfile:{id,companyId}\|null, ownedCompanyId, companyMembership:{companyId,role}\|null} | ✅ |
| GET | /health | — | — | {status:"ok"} | ❌ |
| GET | /config?regionId= | — | — | map `key → {value, valueType}` | ✅ (values unused) |

PASSWORD_RESET purpose exists but there is **no reset-password endpoint**. No profile update endpoint.

## 2. Reference data, home, growth

| Method | Path | Auth | Params / body | Response | Flutter |
|---|---|---|---|---|---|
| GET | /service-categories | JWT | `?type=ON_DEMAND\|CONTRACT\|REMOTE&locale=en\|ar` | active categories with localized name | ✅ |
| GET | /home-layout | JWT | — | PUBLISHED, visible, in-window blocks matching user targeting | ✅ |
| GET | /advertisements | JWT | `?placement=` | active ads for placement | ❌ |
| POST | /advertisements/{id}/events | JWT | `recordAdEventSchema` {type: IMPRESSION\|CLICK\|CONVERSION} | event | ❌ |
| GET | /promotions | JWT | `?categoryId=` | active promotional campaigns | ❌ |

## 3. Provider

| Method | Path | Auth | Body | Response | Flutter |
|---|---|---|---|---|---|
| GET | /providers | JWT | `?categoryId&remoteAvailable=true` | [{id, businessName, bio, ratingAverage, ratingCount, skills}] (ACTIVE+VERIFIED only) | ✅ (remote provider picker) |
| POST | /providers | JWT | `createProviderProfileSchema` {businessName, bio?, yearsOfExperience?, skills?, travelDistanceKm?, remoteAvailable?} | 201 profile · 409 PROVIDER_PROFILE_ALREADY_EXISTS | ❌ **no "become provider" flow** |
| GET / PATCH | /providers/me | JWT | PATCH: `updateProviderProfileSchema` | profile | ✅ |
| POST | /providers/me/availability | JWT | {mode: ONLINE\|OFFLINE\|VACATION\|TEMPORARILY_UNAVAILABLE\|EMERGENCY_OFFLINE} | profile | ✅ |
| GET / POST | /providers/me/documents | JWT | {type, fileUrl(url)} | 201 document | ✅ (user must paste a URL — no upload) |
| POST | /providers/me/verification/submit | JWT | — | profile (PENDING_REVIEW; requires ≥1 document) | ✅ |
| GET / POST | /providers/me/portfolio | JWT | {mediaUrl(url), title?, description?} | item | ✅ |
| DELETE | /providers/me/portfolio/{id} | JWT | — | — | ✅ |
| GET / POST | /providers/me/payout-accounts | JWT | {method, accountDetails: object, isDefault?} | account | ✅ |
| DELETE | /providers/me/payout-accounts/{id} | JWT | — | — | ✅ |
| POST | /providers/me/payout-accounts/{id}/default | JWT | — | — | ✅ |
| GET / POST | /providers/me/withdrawals | JWT | {amount:int>0, method} | 201 withdrawal · 403 WALLET_FROZEN · 409 INSUFFICIENT_BALANCE | ✅ |

No endpoints for provider categories, service areas, working hours, or availability slots.

## 4. Company

| Method | Path | Auth | Body | Flutter |
|---|---|---|---|---|
| POST | /companies | JWT | {name, regionId, description?, logoUrl?} | ❌ **no create-company flow** |
| GET / PATCH | /companies/{id} | JWT (member) | {name?, description?, logoUrl?} | ✅ |
| GET / POST | /companies/{id}/members | JWT (OWNER/MANAGER to invite) | POST {invitedPhone, role?: MANAGER\|STAFF} → creates invitation | ✅ |
| PATCH / DELETE | /companies/members/{memberId} | JWT | PATCH {role: MANAGER\|STAFF} | ✅ |
| GET | /companies/{id}/invitations | JWT | — | ✅ |
| GET | /companies/invitations/mine | JWT | — (matched by caller's phone) | ✅ |
| POST | /companies/invitations/{id}/accept · /cancel | JWT | — | ✅ |
| GET / POST | /companies/{id}/documents | JWT | {type, fileUrl} | ✅ |
| POST | /companies/{id}/verification/submit | JWT | — | ✅ |

## 5. On-Demand

| Method | Path | Auth | Body / params | Flutter |
|---|---|---|---|---|
| GET | /on-demand | JWT (customer's own) | `?status&cursor` | ✅ |
| POST | /on-demand | JWT | {categoryId, description(5–2000), lat, lng, fulfillmentMode?: INSTANT\|SCHEDULED, scheduledFor? (future, required if SCHEDULED), isEmergency?} → 201 request (+ auto-offer to best provider) | ✅ (manual lat/lng text fields) |
| GET | /on-demand/{id} | JWT (party) | — | ✅ |
| POST | /on-demand/{id}/cancel | JWT (customer) | — | ✅ |
| POST | /on-demand/{id}/status | JWT (assigned provider) | {toStatus: EN_ROUTE\|IN_PROGRESS\|COMPLETED} | ❌ |
| GET / POST | /on-demand/{id}/tracking | JWT (party / provider) | POST {lat, lng} | ❌ |
| GET | /on-demand/{id}/assignments | JWT | — | ❌ |
| GET | /on-demand/assignments/me | JWT (provider) | `?status` | ✅ |
| POST | /on-demand/assignments/{id}/accept · /decline | JWT (provider) | — | ✅ |

## 6. Contract

| Method | Path | Auth | Body / params | Flutter |
|---|---|---|---|---|
| GET | /contracts/projects | JWT | `?mine=true&cursor` (otherwise open projects) | ✅ |
| POST | /contracts/projects | JWT | {categoryId, title(3–150), description(10–5000), budgetMin?, budgetMax?} | ✅ |
| GET | /contracts/projects/{id} | — (public) | — | ✅ |
| POST | /contracts/projects/{id}/cancel | JWT (customer) | — | ❌ |
| GET / POST | /contracts/projects/{id}/bids | JWT | POST {amount:int>0, message?} | ✅ |
| GET | /contracts/bids/me | JWT (provider) | `?status` | ✅ |
| POST | /contracts/bids/{bidId}/award | JWT (customer) → 201 contract | ✅ |
| POST | /contracts/bids/{bidId}/withdraw | JWT (provider) | ✅ |
| GET | /contracts/{id} | JWT (party) | ✅ |
| GET / POST | /contracts/{id}/milestones | JWT (party) | {title, amount, dueDate?} | ✅ |
| POST | /contracts/milestones/{id}/status | JWT (party; provider IN_PROGRESS/SUBMITTED, customer APPROVED) | {toStatus} | ❌ |
| POST | /contracts/milestones/{id}/fund | JWT (customer) → 201 {escrowId} · 402 PAYMENT_CAPTURE_FAILED · 409 ESCROW_ALREADY_FUNDED | ❌ |
| POST | /contracts/{id}/complete · /cancel | JWT | — | ❌ |
| GET / POST | /contracts/{id}/documents | JWT | {fileUrl} | ❌ |

## 7. Remote

| Method | Path | Auth | Body / params | Flutter |
|---|---|---|---|---|
| GET | /remote | JWT | `?role=provider` (default customer) | ✅ |
| POST | /remote | JWT | {providerId, categoryId, title, priceType: FIXED\|HOURLY, amount} | ✅ |
| GET | /remote/{id} | JWT (party) | ✅ |
| GET / POST | /remote/{id}/milestones | JWT | {title, amount, dueDate?} | ✅ |
| POST | /remote/milestones/{id}/status | JWT | {toStatus} | ❌ |
| POST | /remote/milestones/{id}/fund | JWT (customer) | — | ❌ |
| POST | /remote/{id}/deliver · /complete · /cancel | JWT | — | ❌ |
| GET / POST | /remote/{id}/revisions | JWT | {notes} | ❌ |
| POST | /remote/revisions/{id}/status | JWT | {toStatus: IN_PROGRESS\|RESOLVED} | ❌ |
| GET / POST | /remote/{id}/meetings | JWT | {scheduledAt, joinUrl?} | ❌ |

## 8. Wallet, disputes, notifications, webhooks

| Method | Path | Auth | Body / params | Flutter |
|---|---|---|---|---|
| GET | /wallets/me | JWT | — → {id, userId, companyId, currency, isFrozen, …, balances:[{bucket, amount}]} (auto-creates wallet) | ✅ |
| GET | /wallets/me/transactions | JWT | `?cursor&limit` → [{id,type,amount,currency,status,direction:IN\|OUT,relatedEntityType,relatedEntityId,createdAt}] | ✅ |
| GET / POST | /disputes | JWT | POST {relatedEntityType, relatedEntityId, reason} (party check) | ✅ |
| GET | /notifications | JWT | `?unreadOnly=true&cursor&limit` | ✅ |
| GET | /notifications/unread-count | JWT | → {count} | ✅ |
| POST | /notifications/{id}/read | JWT | — | ✅ |
| POST | /notifications/read-all | JWT | → {updatedCount} | ✅ |
| POST | /webhooks/payments/{provider} | HMAC header `x-webhook-signature` | raw JSON {type, gatewayRef, amount?, currency?} | n/a |

## 9. Admin API (`/api/v1/admin/*`, Bearer + permission)

| Area | Endpoints | Permission |
|---|---|---|
| Dashboard | GET dashboard/metrics | dashboard.view |
| Users | GET users, GET users/{id}, POST users/{id}/suspend {reason}, POST users/{id}/reactivate | users.manage |
| Providers | GET providers, DELETE providers/{id}, POST …/suspend {reason}, …/reactivate, …/verification {decision, reason?}, PATCH …/documents/{documentId} {status} | providers.manage |
| Companies | same shape as providers under companies/ | companies.manage |
| Services | GET on-demand, GET contracts/projects, GET remote | services.manage |
| Milestone payout | POST contracts/milestones/{id}/mark-paid | contracts.manage |
| | POST remote/milestones/{id}/mark-paid | remote.manage |
| Ads / Promotions | GET/POST list, GET/PATCH {id}, POST {id}/activate, /deactivate | advertisements.manage / promotions.manage |
| Notifications | GET/POST notifications, GET {id}, POST {id}/send | notifications.manage |
| Config | GET/POST config, GET/PATCH/DELETE config/{id} | config.manage |
| AI | GET ai/toggles, PUT ai/toggles/{capability} | ai.manage |
| Workflows | GET/POST workflows, GET {id}, POST {id}/activate, /archive, GET {id}/instances, GET workflow-instances/{id} | workflows.manage |
| Finance | GET withdrawals; POST withdrawals/{id}/approve, /reject {reason}, /mark-paid {gatewayProvider, gatewayRef?}, /mark-failed {reason}; POST settlements {schedule, currency, scheduledFor?}, POST settlements/{id}/complete; POST disputes/{id}/resolve {resolutionNotes, resolution}; POST refunds {relatedEntityType, relatedEntityId, regionId, refundAmount?, reason}; GET wallets/{walletId}, escrows/{id}, ledger/accounts/{code}, …/statement, ledger/journal-entries, reports/trial-balance, reconciliation | finance.manage |
| Audit | GET audit-logs | audit.view |

Some admin directories (e.g. `admin/finance/disputes`, `escrows`, `wallets`, `settlements/[id]`) contain only sub-routes — there is no list endpoint for escrows/wallets/disputes in the API; the admin pages read those directly through repositories.

## 10. Contract verification notes

Checked both sides for every endpoint Flutter calls: paths, methods, request field names and enum wire values
match the Zod schemas; response fields read by Flutter `fromJson` exist in the backend responses. Mismatches found:

1. **Money units**: Flutter sends the integer typed by the user and displays raw integers; backend treats them as minor units; the Admin UI divides by 100. "500" typed in the app = 5.00 SDG in admin.
2. **Phone in OTP route**: Flutter navigates to `/otp?phone=+249…` without URL-encoding; `Uri.queryParameters` decodes `+` as a space, so the OTP screen sends `" 249…"` → `404 USER_NOT_FOUND`. (Code-reading finding; not reproduced on a device.)
3. Pagination: backend accepts `cursor`, Flutter never sends it — lists silently truncate at the default page size.
