# SAHL — Product Overview

Status: Draft v1.0 · Source of truth: [00-master-prompt.md](00-master-prompt.md) (technical brief) + [00-business-requirements.md](00-business-requirements.md) (business/product spec) + [00-functional-requirements.md](00-functional-requirements.md) (functional/user stories) + [00-ui-ux-design-system.md](00-ui-ux-design-system.md) (design system)

## 1. Identity

| | |
|---|---|
| Product | SAHL |
| Parent company | SAIR |
| Type | National digital service marketplace (multi-service, multi-role) |
| Initial market | Sudan (`SD`) — currency SDG, languages `en`/`ar` (see [ADR-001](02-architecture.md#adr-001-locale--payment-abstraction)) |
| Primary color | Orange `#F57C00` (full palette + type scale in [08-design-system.md](08-design-system.md)) |
| Typography | Inter (English) / IBM Plex Sans Arabic (Arabic), switches automatically by locale |
| Design system | Material Design 3, light + dark, WCAG-AA accessible, responsive |
| Languages | Arabic (RTL), English (LTR) — instant switch, no hardcoded UI strings |

## 2. Vision & Mission

- **Vision**: become the largest digital services marketplace in the country, then expand regionally.
- **Mission**: an easy, trusted, secure, intelligent platform where customers request any service and providers grow their business.
- **Core principle**: SAHL is not a directory. It interprets intent and routes to the right provider automatically.

  > "My car stopped." → Emergency → Vehicle → Towing → best-matched provider surfaced automatically.

  This intent-understanding step is a distinct system component (see [free-text intake → category classifier] in [06-smart-matching.md](06-smart-matching.md)), not a search bar with filters.

## 3. Goals & Business Objectives

**Primary goals**: make requesting any service easy · help providers find customers · build trust between both parties · reduce search time · simplify payments · digitize traditional service markets.

**Secondary goals**: increase employment opportunities · support freelancers and SMEs · improve service quality through ratings · build a reliable digital ecosystem.

| Horizon | Objectives |
|---|---|
| **Year 1** | Become the leading service marketplace in Sudan. Acquire thousands of verified providers. Establish customer trust. Launch sustainable monetization (Phase 2 revenue, see §8). |
| **Year 2** | Expand into neighboring countries (validates [ADR-001](02-architecture.md#adr-001-locale--payment-abstraction)'s multi-region design). Launch enterprise accounts and business APIs. Introduce AI-powered recommendations (see [06-smart-matching.md](06-smart-matching.md) §6–7). |

These map directly onto the phased roadmap in [07-roadmap.md](07-roadmap.md): Year 1 ≈ Phase 1–2, Year 2 ≈ Phase 3.

## 4. Service Types

| Type | Duration | Examples | Distinguishing mechanics |
|---|---|---|---|
| **On-Demand** | Hours | Plumbing, electricity, mobile mechanic, towing, cleaning, delivery, moving, road assistance | GPS + live tracking, immediate dispatch, distance-weighted matching |
| **Scheduled** | Booked ahead | Same category pool as On-Demand, booked for a future date | Appointment/calendar management, reminders — modeled as a *booking mode* of On-Demand, not a separate context: see [ADR-003](02-architecture.md#7-adr-003-scheduled-service-is-a-booking-mode-of-on-demand-not-a-fourth-bounded-context) |
| **Contract** | Weeks–months | Construction, engineering, architecture, maintenance contracts, factories, consultation, legal | Project posting → tendering/bidding → contract → milestones → progress tracking → invoices → documents |
| **Remote** | N/A (digital delivery) | Programming, design, translation, marketing, video editing, accounting, writing, training, consulting | Files, revisions, milestones, chat, video meetings — no location component |

On-Demand/Scheduled, Contract, and Remote are the three bounded contexts in the architecture (each with its own request/fulfillment state machine), sharing Identity, Provider Profile, Payments, Chat, and Review subsystems — see [02-architecture.md](02-architecture.md) §3.

## 5. User Roles

| Role | Notes |
|---|---|
| Guest | Unauthenticated visitor — browse categories/providers, no `User` row. Not an RBAC concern, just "which routes don't require a session," see [04-api-modules.md](04-api-modules.md) §2 |
| Customer | Default role for any account |
| Service Provider | Any account may activate a provider profile — **one identity, dual role**, not separate account types |
| Business Provider | A `ProviderProfile` operated by a `Company`'s staff rather than one individual — see [ADR-004](02-architecture.md#8-adr-004-businesscompany-accounts-extend-identity-they-dont-fork-it) |
| Company Account | A `Company` (Owner/Manager/Staff members) acting as customer for bulk requests/company projects, or as the operator of a Business Provider — same ADR-004 |
| Administrator | Operational management within scope |
| Super Administrator | Full platform control |
| Support Team (Customer Support) | Ticket/conversation handling |
| Moderator | Content/listing moderation |
| Verification Officer | KYC / provider verification workflow |
| Finance Officer | Payments, payouts, commission, disputes |

Role/permission enforcement runs on three independent axes, not one `role` enum: **Customer↔Provider duality** (authorization evaluated per-action against active profiles on the account), **staff RBAC** (`StaffRole`/`Permission` for admin-console access, see [05-security.md](05-security.md)), and **company membership** (`CompanyMember.role`, scoped to a specific `Company`, for Business Provider/Company Account actions). A user can sit on all three axes at once — e.g. a `CompanyMember` with `MANAGER` role who is also personally a `Customer` elsewhere on the platform.

## 6. Target Users

### Customer

A person or business looking for a service — homeowners, businesses, students, government agencies, NGOs, factories, stores.

- **Goals**: find providers quickly, compare offers, track requests, pay safely, receive quality work, leave reviews.
- **Pain points today**: searching manually, no trusted providers, no transparent pricing, poor communication, no guarantee of quality.
- **Journey**: Discover → Search → Browse providers → Compare → Choose provider → Send request → Provider accepts → Payment authorization → Service execution → Completion → Review → Repeat usage.

### Service Provider

Individuals or companies offering services — electricians, plumbers, mechanics, construction companies, architects, lawyers, doctors (future), graphic designers, developers, freelancers, marketing agencies, cleaning companies, transport companies, delivery companies.

- **Goals**: receive more customers, increase income, manage jobs, receive payments, build reputation.
- **Pain points today**: finding clients, advertising costs, managing appointments, payment collection, customer trust.
- **Journey**: Register → Identity verification → Create profile → Add services → Set availability → Receive requests → Accept → Complete work → Receive payment → Build reputation → Grow business.

Both journeys are the reference flows product/UX decisions are checked against — a feature that doesn't shorten or de-risk a step in one of these journeys needs a specific justification to ship.

## 7. Market Segments

Individual Services · Business Services · Construction · Transportation · Maintenance · Digital Services · Professional Consulting · Emergency Services · Home Services · Automotive Services · Industrial Services · Education Services · Healthcare Services (future) · Government Services (future).

These segments cut across the four service types (§4) — e.g. "Emergency Services" is mostly On-Demand, "Construction" is mostly Contract, "Digital Services" is mostly Remote — and are a taxonomy/discovery concern (`ServiceCategory` grouping), not a separate domain model.

## 8. Business Model

| Phase | Revenue streams |
|---|---|
| **Launch** (Phase 1, Year 1 start) | Free registration, free listings, zero/minimal commission, referral rewards, provider growth campaigns |
| **Growth** (Phase 2, Year 1) | Transaction commissions, premium subscriptions, featured providers, sponsored services, verification fees, advertising, business plans |
| **Enterprise** (Phase 3, Year 2) | Company dashboards, enterprise subscriptions, API licensing, marketplace integrations, analytics subscriptions, sponsored marketplaces |

Implication for architecture: billing/commission logic must be **pluggable and off by default**, not bolted on later — see the Payments abstraction in [02-architecture.md](02-architecture.md) and `CommissionRule.isActive` in [03-database-schema.md](03-database-schema.md).

## 9. Success Metrics

MAU/DAU · Verified Providers · Completed Orders · Average Response Time · Customer/Provider Satisfaction · Average Rating · Revenue · Retention Rate · Conversion Rate · Dispute Resolution Time · Support Response Time · Payment Success Rate · Referral Growth.

Every one of these needs a concrete data source before it's a real metric, not just a name — tracked against schema/instrumentation in [07-roadmap.md](07-roadmap.md).

## 10. Platform Philosophy & Product Principles

Simple · Fast · Reliable · Secure · Professional · Minimal · Modern · Scalable.

Extended product principles (from [00-business-requirements.md](00-business-requirements.md)): simple before complex · trust before growth · quality before quantity · scalable before optimized · secure by default · mobile first · accessibility first · localization first · performance first · AI ready · offline tolerant where possible · future-proof architecture.

**Every feature must contribute to improving trust, speed, simplicity, or business growth.** This is the standing bar applied in the review checklist in [07-roadmap.md](07-roadmap.md) §5.

## 11. Related Documents

- [00-business-requirements.md](00-business-requirements.md), [00-functional-requirements.md](00-functional-requirements.md), [00-ui-ux-design-system.md](00-ui-ux-design-system.md) — source specs
- [02-architecture.md](02-architecture.md) — Clean Architecture, tech stack, multi-country/currency/payment abstraction, ADRs
- [03-database-schema.md](03-database-schema.md) — data model
- [04-api-modules.md](04-api-modules.md) — module boundaries, RBAC matrix
- [05-security.md](05-security.md) — security controls
- [06-smart-matching.md](06-smart-matching.md) — matching engine design
- [07-roadmap.md](07-roadmap.md) — phased roadmap, business objectives, success metrics
- [08-design-system.md](08-design-system.md) — design tokens, engineering decisions for the UI/UX spec
