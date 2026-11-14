# SAHL Mobile — Phase 1 Screen Inventory & Backend Gap Report

Date: 2026-11-14. Basis: the code in `apps/mobile`, the FastAPI service `apps/api` (what the app calls, deployed at
`https://mobile-app-ynec.onrender.com`), the legacy Next.js API in `apps/backend/src/app/api/v1` (not called by the app
any more), and the Prisma/PostgreSQL schema.

## 1. What exists today

### Architecture (keep as is)
`features/<feature>/{domain,data,application,presentation}`, Riverpod 2 (no codegen), GoRouter 14 with one auth
redirect, Dio `ApiClient` + `AuthInterceptor` (token refresh), repositories return `Result<T>`, ARB localization
(ar default, en; 286 keys each), Material 3 theme in `core/theme/*` with a `SahlSemanticColors` extension.

### Existing screens (32)
| Area | Screens | Notes |
|---|---|---|
| Auth (new design) | Welcome, Login, Register (3 steps), Session restoring | Always dark brand style (`AuthPalette`) |
| Home | HomeScreen → Customer / Provider / Company home | No bottom navigation; menus in app-bar overflow |
| On-demand | Request list, Create request, Request detail, Provider offers | Manual lat/lng entry |
| Contract | My projects, Create project, Browse projects, Project detail (bids/award), Contract detail (milestones), My bids | |
| Remote | My engagements (customer / provider), Create engagement, Engagement detail (milestones) | |
| Provider | Profile edit, Verification (documents), Portfolio, Payout accounts | Documents/portfolio take a URL, no upload |
| Company | Members (invite/role/remove), Verification, My invitations | |
| Shared | Wallet, Withdrawals, Notifications, My disputes (+ open-dispute sheet) | |

### Shared widgets today
`AsyncValueView`, `EmptyStateView`, `ErrorBanner`, status labels per feature, auth brand widgets
(`GradientButton`, `AuthTextField`, `BrandMark`, …). No skeletons, cards, stat tiles, confirm dialog or success screen.

### Theme / settings gaps
- Light and dark `ThemeData` exist, but `SahlSemanticColors` is identical in both modes, and screens mostly use defaults.
- Theme mode and language are **not persisted** (reset on restart); language can only be switched on auth screens.
- Hive is a dependency but never initialised.

## 2. Backend reality (what each screen can be built on)

Legend: **API** = served by FastAPI now · **PORT** = exists only in the legacy Next.js API, must be ported to FastAPI
(logic already written and unit-tested in TypeScript) · **NEW** = table exists, no endpoint anywhere · **SCHEMA** = needs a
database change · **EXT** = needs an external service/credential.

| Capability | Status | Notes |
|---|---|---|
| Auth, `/users/me`, register with role, admin approval | API | |
| Edit own profile (name, photo, address, language) | NEW | `User` has the columns; no endpoint |
| Change password | NEW | |
| Service categories (3 types, ar/en) | API | Types: `ON_DEMAND`, `REMOTE`, `CONTRACT` |
| Browse providers by category | API | Only ACTIVE+VERIFIED providers that have the category |
| Provider "services" (category + price range) | NEW | `ProviderCategory {categoryId, priceMin, priceMax}`; no description/active flag (that would be SCHEMA) |
| Provider service areas | NEW | `ProviderServiceArea`; matching needs it (bug B-04) |
| Working days / hours | NEW | `ProviderWorkingHours` |
| Availability status | API | |
| Public provider profile (by id) + portfolio | NEW | Only `/providers/me` exists |
| Reviews & ratings | NEW | `Review`, `ReviewCategoryScore`; rating aggregates never updated |
| Search | NEW | No search endpoint; categories + provider list only |
| On-demand: create / list / detail / cancel / provider accept-decline | API | |
| On-demand: provider job progress (en route → in progress → completed), tracking | PORT | |
| On-demand: price / payment | SCHEMA | Request has no price; `quotedPrice` unused |
| Scheduled booking (date/time) | API | `fulfillmentMode=SCHEDULED, scheduledFor` accepted; never dispatched (no scheduler) |
| Contract: post / browse / bid / award / milestones list+create | API | |
| Contract: milestone status, fund (escrow), complete, cancel, documents | PORT | |
| Remote: create / list / detail / milestones | API | |
| Remote: deliver, complete, cancel, revisions, meetings, milestone status/fund | PORT | |
| Wallet balance + transactions, provider withdrawals | API | |
| Wallet deposits / top-ups | EXT | Only the mock payment gateway exists |
| Notifications list / read | API | Only admin broadcasts create notifications |
| Notification preferences | NEW | `User.notificationPreferences` (JSON) |
| Chat / messages | NEW | `Conversation`, `Message`; no endpoints, no realtime client |
| Disputes (open, list) | API | |
| Support tickets (help) | NEW | `SupportTicket`, `SupportTicketMessage` |
| Company: profile, members, invitations, documents, verification | API | |
| Company: assign jobs to team members, track team jobs | NEW | Uses member provider profiles; no endpoint |
| Company: clients list | NEW | Derivable from jobs/contracts; no endpoint |
| Company finance (company wallet, revenue) | NEW | `Wallet.companyId` exists; no endpoint |
| Image upload (avatar, portfolio, documents) | EXT | No storage adapter (Cloudinary credentials empty), no `image_picker` |
| Map / GPS location picker | EXT | No maps/geolocation package or API key |
| Promotions / ads banners | PORT | Legacy `/promotions`, `/advertisements` |
| Saved addresses (several) | SCHEMA | User has one address only |

## 3. Requested screens → buildable now?

| # | Screen | Build on |
|---|---|---|
| C-A | Customer Home | API (+ PORT promotions for banners) |
| C-B | Explore | API categories/providers; real search = NEW |
| C-C | Service Details | NEW (provider services/prices); category+provider list available now |
| C-D | Provider Profile (public) | NEW |
| C-E | Booking flow | API (on-demand create incl. scheduled); images EXT, map EXT |
| C-F | My Requests (tabs) | API |
| C-G | Long-term contracts | API (+ PORT for fund/complete/cancel) |
| C-H | Wallet | API (deposits EXT) |
| C-I | Messages | NEW |
| C-J | Profile & settings | Settings local; profile edit/password/notification prefs NEW; support NEW |
| P-A | Provider Dashboard | API (earnings from wallet; rating fields exist) |
| P-B | Job requests (accept/decline) | API |
| P-C | Active jobs + status updates | PORT |
| P-D | My services | NEW |
| P-E | Portfolio | API (uploads EXT) |
| P-F | Availability, working hours | status API; hours NEW |
| P-G | Earnings / withdrawals | API |
| P-H | Reviews | NEW |
| P-I | Verification | API (uploads EXT) |
| P-J | Provider profile & settings | API + NEW |
| CO-A | Company Dashboard | API (members, verification) + NEW (jobs/revenue) |
| CO-B | Team management | API (invite/roles/remove); availability/performance NEW |
| CO-C | Company services | NEW |
| CO-D | Job management / assignment | NEW |
| CO-E | Contract management | API (bids) + PORT |
| CO-F | Clients | NEW |
| CO-G | Company finance | NEW |
| CO-H | Company profile & settings | API |
| S | Notifications, Disputes, Wallet | API · Chat NEW · Reviews NEW · Help NEW |

## 4. Decisions (2026-11-14)

- Missing APIs are **built in FastAPI** in the same phase as their screens (tables already exist; no schema changes
  without separate approval). Legacy Next.js endpoints the app needs are ported.
- Service types: **On-Demand = `ON_DEMAND`, Short-Term = `REMOTE`, Long-Term = `CONTRACT`**.
- Welcome / Login / Sign-up stay **always dark**; every other screen follows Light / Dark / System.
- Uploads: `image_picker` + a FastAPI upload endpoint storing to **Cloudinary** (keys to be provided). Upload buttons
  are hidden while keys are missing — never faked.

## 5. Proposed structure changes (awaiting approval)

1. **Role shells with bottom navigation** — GoRouter `StatefulShellRoute` per role, each tab keeping its own stack:
   - Customer: `/c/home`, `/c/explore`, `/c/requests`, `/c/wallet`, `/c/profile`
   - Provider: `/p/dashboard`, `/p/jobs`, `/p/services`, `/p/earnings`, `/p/profile`
   - Company: `/co/dashboard`, `/co/jobs`, `/co/team`, `/co/finance`, `/co/profile`
   `/home` redirects to the signed-in role's first tab; the router redirect blocks other roles' routes. Existing detail
   routes (`/on-demand/:id`, `/contracts/:id`, `/remote/:id`, …) are kept and reused.
2. **Settings persistence** — initialise Hive in `main()`; persist theme mode (Light/Dark/System) and language; apply
   the user's saved `preferredLanguage` after login. No new dependency.
3. **Theme tokens** — real light/dark values for `SahlSemanticColors` (surfaces, borders, muted text, brand gradient),
   so screens never hardcode colors.
4. **Shared UI kit** in `shared/widgets`: card, section header, stat tile, status chip, skeleton loaders, empty/error
   states, confirm dialog, success screen, avatar, search field, category tile, rating stars.
5. **New dependency**: `image_picker` only (with uploads).
6. **Backend additions by phase** (FastAPI, each with pytest):
   - Customer: public provider profile + services, search, profile edit, password change, notification preferences,
     reviews (create/list, rating aggregates), support tickets, promotions; port on-demand job status.
   - Provider: services CRUD (`ProviderCategory`), service areas, working hours, earnings summary; port job progress.
   - Company: assign jobs to members, team jobs, clients, company wallet/finance.
   - Shared: chat (REST + polling first; live sockets later), Cloudinary uploads, contract/remote lifecycle ports
     (fund, complete, cancel, deliver, revisions).
7. **Order**: Phase 2 (items 1–4) → Phase 3 Customer → Phase 4 Provider → Phase 5 Company → Phase 6 shared + chat
   → Phase 7 full test pass. Each phase ends with `flutter analyze`, `flutter test`, `pytest`, and a report.

## 6. Phase 2 — done (2026-11-14)

- Role shells with 5-tab bottom navigation (`/c/*`, `/p/*`, `/co/*`), `/home` → role's first tab, router blocks
  other roles' tabs and role-only detail routes; re-routes when the role changes (e.g. invitation accepted).
- Theme tokens: real light/dark `SahlSemanticColors` + `context.sahl`; navigation bar, cards, inputs, segmented
  buttons themed. Theme mode (System/Light/Dark) and language persisted with Hive; account language applied after
  login unless the user chose one on the device.
- Shared kit `shared/widgets/sahl_ui.dart`: SahlCard, GradientCard, SectionHeader, IconBadge, StatTile, ActionTile,
  ActionGroup, StatusChip, SahlAvatar, SearchBarButton, RatingStars, SkeletonBox/SkeletonList, showConfirmDialog,
  SuccessView; `EmptyStateView` restyled; `AsyncValueView` takes a skeleton loader.
- Tabs today: Customer Home / Explore (real categories → request flows) / Requests hub / Wallet / Profile;
  Provider Dashboard (stats, availability) / Jobs hub / Services hub / Earnings / Profile;
  Company Dashboard (members, pending invites) / Jobs* / Team / Finance* / Profile.
  *Company Jobs and Finance show an explicit "not available yet" state until Phase 5 builds their API.
- Also: session restore retries once on network failure and timeouts allow for Render cold starts.
- Verified: flutter analyze (31 pre-existing infos, 0 warnings), flutter test 38/38, on-device (Realme, Render API)
  for the provider role in light/dark and ar/en. Customer/company shells verified by router tests only.

## 7. Phase 3 — Customer (done 2026-11-14)

### New API endpoints (`apps/api`, all covered by `tests/test_customer_phase3.py`)

| Endpoint | Purpose |
|---|---|
| `PATCH /users/me`, `POST /users/me/password` | Edit profile; change password (signs out other devices, returns a new session) |
| `GET/PUT /users/me/notification-preferences` | Orders / messages / promotions / account switches |
| `GET /explore/providers`, `GET /search` | Provider listing (sort, category, remote-only) and combined search |
| `GET /service-categories/{id}` | Service details with provider count and price range |
| `GET /providers/{id}/profile`, `GET /providers/{id}/reviews` | Public provider profile (ACTIVE + VERIFIED only) |
| `GET /promotions` | Active campaigns for Home |
| `GET /reviews/for-job`, `POST /reviews` | Customer reviews of completed jobs; updates provider rating |
| `GET/POST /support/tickets`, `GET /support/tickets/{id}`, `POST /support/tickets/{id}/messages` | Help & support |
| `POST /contracts/projects/{id}/cancel` | Customer cancels an open project |
| `POST /contracts/milestones/{id}/status`, `POST /remote/milestones/{id}/status` | Provider: IN_PROGRESS/SUBMITTED; customer: APPROVED |
| `GET /on-demand/{id}/assignments` | Offers for a request, with provider name and rating |
| `GET /contracts/projects/{id}` now returns `contractId` | Lets the customer open the contract after awarding a bid |

### Screens

| Route | Screen |
|---|---|
| `/c/home` | Greeting, search, active request, service types, offers, top-rated providers, admin blocks |
| `/c/explore` | Categories by type → service details; search action |
| `/search` | Debounced search across services and providers |
| `/services/:categoryId` | Service details: type, description, price range, providers (sortable), request/post action |
| `/providers/:id`, `/providers/:id/reviews` | Public provider profile and all reviews; "Book this provider" for short-term services |
| `/book?categoryId=` | On-demand booking: service → details → location (geolocator) → now/schedule → review → success. Replaces `/on-demand/new` (now redirects) |
| `/c/requests` | My Requests: On-Demand / Short-Term / Long-Term with status buckets |
| `/on-demand/:id` | Status, schedule, assigned provider, cancel (confirm), review when completed |
| `/remote/:id`, `/contracts/:id` | Milestones with role-based actions (start / submit / approve with confirm), disputes, review when completed |
| `/contracts/projects/:id` | Budget, bids, award, cancel project (confirm), view contract |
| `/c/wallet` | Balance card, pending/on-hold, typed transaction history |
| `/account/edit`, `/account/password`, `/account/notifications` | Edit profile, change password, notification preferences |
| `/support`, `/support/new`, `/support/:id` | Ticket list, new ticket, conversation with reply |

### Notes and limitations

- The on-demand address is appended to the description as `Address: …` (no address column; no schema change).
- Booking needs location permission; the browser preview can't grant it, so the full submit was checked through the API.
- Profile photo upload stays hidden until Cloudinary keys are configured.
- Amounts are shown as stored integers (open item B-08: minor vs major units).
- Render does not have these endpoints until the branch is pushed and redeployed.
