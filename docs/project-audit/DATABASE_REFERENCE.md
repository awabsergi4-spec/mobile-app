# Database Reference

Source of truth: `apps/backend/prisma/schema.prisma` (2,411 lines, **93 models**, ~60 enums), PostgreSQL via Prisma 5.
IDs are `cuid()` strings. Money = `Int` minor units. Polymorphic references
(`relatedEntityType` + `relatedEntityId`) have **no DB foreign key** — validated in application code.

## 1. Migrations & seed

- One migration: `prisma/migrations/20260807093213_init` (93 `CREATE TABLE`, matches schema).
- Local DB on the audit machine: `prisma migrate status` → **up to date**; `prisma validate` → valid.
- `prisma/seed.ts` (run with `npx prisma db seed`, idempotent upserts):
  - Region `SD` (Sudan, SDG, ar)
  - 7 service categories with en/ar translations (ON_DEMAND: Towing, Plumbing, Electrical; CONTRACT: Construction, Legal Consultation; REMOTE: Programming, Graphic Design)
  - 9 `AiFeatureToggle` rows (all disabled, `rule-based`)
  - 15 permissions + `SUPER_ADMIN` role holding all
  - 8 ledger accounts (see §4), currency = region currency (SDG)
  - Bootstrap admin user from `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` (ACTIVE, SUPER_ADMIN)
- Local DB row counts at audit time: region 1, user 3, staffRole 1, permission 15, userStaffRole 1,
  ledgerAccount 8, serviceCategory 7, aiFeatureToggle 9, wallet 1; **0** providers, companies, requests,
  escrows, journal entries, gateway configs, remote-config entries, home-layout blocks, commission rules, workflows.

### Required initial records (app breaks without them)
| Record | Why |
|---|---|
| Region `code = "SD"` | `POST /auth/register` hard-codes it → 500 `REGION_NOT_SEEDED` otherwise |
| Ledger accounts | Any escrow/withdrawal posting throws `LedgerAccountNotFoundError` |
| Permissions + staff role + one `UserStaffRole` | No admin access otherwise (no API to grant staff roles) |
| Service categories | All three service creation flows need a category |

## 2. Model groups

| Group | Models |
|---|---|
| Platform | `Region`, `PaymentGatewayConfig` |
| Identity | `User`, `OtpCode`, `RefreshToken`, `StaffRole`, `Permission`, `StaffRolePermission`, `UserStaffRole`, `DeviceToken` |
| Company | `Company`, `CompanyMember` (unique companyId+userId), `CompanyBranch`, `CompanyDepartment`, `CompanyDocument`, `CompanyContact`, `CompanyInvitation` |
| Provider | `ProviderProfile` (1:1 User), `ProviderPayoutAccount`, `ProviderWorkingHours`, `ProviderPortfolioItem`, `ProviderDocument`, `ProviderServiceArea`, `ProviderCategory` (unique provider+category), `ProviderAvailabilitySlot` |
| Taxonomy | `ServiceCategory` (self-hierarchy, type ON_DEMAND/CONTRACT/REMOTE), `ServiceCategoryTranslation` (unique category+locale) |
| On-Demand | `OnDemandRequest`, `OnDemandAssignment`, `OnDemandTrackingPing`, `MatchingScoreLog` |
| Contract | `ContractProject`, `ContractBid`, `Contract` (1:1 project), `ContractMilestone`, `ContractDocument` |
| Remote | `RemoteEngagement`, `RemoteMilestone`, `RemoteRevision`, `RemoteMeeting` |
| Finance | `Wallet`, `WalletBalance`, `LedgerAccount`, `JournalEntry`, `JournalLine`, `Escrow`, `PaymentTransaction`, `Withdrawal`, `Settlement`, `CommissionRule`, `ExchangeRate`, `TaxRule`, `RefundPolicy`, `SubscriptionPlan`, `Subscription` |
| Chat | `Conversation` (1:1 with on-demand/contract/remote), `Message` |
| Trust & safety | `Review`, `ReviewCategoryScore`, `Favorite`, `SupportTicket`, `SupportTicketMessage`, `Dispute`, `DisputeEvidence`, `Report` |
| Growth | `ReferralCode`, `ReferralRedemption`, `PromotionalCampaign`, `Advertisement`, `AdEvent`, `Coupon`, `CouponRedemption` |
| Admin content | `RemoteConfigEntry` (unique key+region), `CmsPage`, `CmsPageTranslation`, `HomeLayoutBlock`, `MessageTemplate`, `MessageTemplateTranslation`, `NotificationBroadcast`, `PopupCampaign`, `AdminDashboardWidgetPreference` |
| Notifications | `Notification` |
| Search / AI | `SearchQueryLog`, `AiFeatureToggle` (unique capability), `AiProviderConfig`, `AiUsageLog` |
| Audit | `AuditLog` |
| Workflow | `DomainEvent`, `WorkflowDefinition` (unique key+version), `WorkflowStep`, `WorkflowInstance`, `WorkflowStepExecution`, `AutomationRule` |

Models with **no application code at all**: Conversation, Message, Review, ReviewCategoryScore, Favorite,
SupportTicket(+Message), Report, ReferralCode/Redemption, Coupon(+Redemption), Subscription(+Plan),
TaxRule, RefundPolicy, ExchangeRate, CmsPage(+Translation), PopupCampaign, MessageTemplate(+Translation),
AdminDashboardWidgetPreference, SearchQueryLog, AiProviderConfig (read by registry only), AiUsageLog,
AutomationRule, CompanyBranch/Department/Contact, ProviderWorkingHours, ProviderServiceArea (read only by matcher),
ProviderCategory (read only), ProviderAvailabilitySlot, DeviceToken, DisputeEvidence.

## 3. Key enums (status machines)

- `UserStatus`: PENDING_VERIFICATION → ACTIVE ↔ SUSPENDED, BANNED
- `VerificationStatus`: UNVERIFIED, PENDING_REVIEW, VERIFIED, REJECTED, NEEDS_MORE_INFO, EXPIRED, REVOKED
- `AccountLifecycleStatus` (provider/company): ACTIVE, SUSPENDED, DELETED
- `OnDemandStatus`: SEARCHING → ASSIGNED → EN_ROUTE → IN_PROGRESS → COMPLETED; CANCELLED
- `AssignmentStatus`: OFFERED, ACCEPTED, DECLINED, EXPIRED
- `ContractProjectStatus`: OPEN_FOR_BIDS, AWARDED, CANCELLED · `BidStatus`: SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN
- `ContractStatus`: IN_PROGRESS, COMPLETED, DISPUTED, CANCELLED
- `MilestoneStatus` (contract & remote): PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID
- `RemoteEngagementStatus`: ACTIVE, DELIVERED, COMPLETED, CANCELLED · `RevisionStatus`: REQUESTED, IN_PROGRESS, RESOLVED
- `EscrowStatus`: HELD, PARTIALLY_RELEASED, RELEASED, PARTIALLY_REFUNDED, REFUNDED, DISPUTED, EXPIRED, CANCELLED
- `TransactionType` (17) / `TransactionStatus`: PENDING, HELD, SUCCEEDED, FAILED, REVERSED
- `WithdrawalStatus`: REQUESTED, PENDING_APPROVAL, APPROVED, REJECTED, PROCESSING, PAID, FAILED
- `WalletBucket`: AVAILABLE, PENDING, LOCKED, REWARD, CASHBACK, BONUS, INCENTIVE
- `RelatedEntityType`: ON_DEMAND_REQUEST, CONTRACT, CONTRACT_MILESTONE, REMOTE_ENGAGEMENT, REMOTE_MILESTONE, WITHDRAWAL, ESCROW, SETTLEMENT, SUBSCRIPTION, WORKFLOW_INSTANCE, PROVIDER_PROFILE, COMPANY, PAYOUT (deprecated), USER
- `PublishStatus`: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED

## 4. Financial data model

```
LedgerAccount (code unique, type, currency) ──< JournalLine >── JournalEntry (idempotencyKey unique, reversalOfId unique)
                                                                     │ 1:1
PaymentTransaction (type, status, amount, wallet src/dst, idempotencyKey unique) ─┘
Escrow (unique relatedEntityType+relatedEntityId; amount, releasedAmount, refundedAmount)
Wallet (userId XOR companyId, currency, isFrozen) ──< WalletBalance (unique wallet+bucket, amount)
Withdrawal (provider, wallet, amount, fee, method, status) >── Settlement (batch)
CommissionRule (providerId? / subscriptionPlanId? / categoryId? / global; %, flat, min, max, isActive default false)
```

Seeded chart of accounts (currency SDG):

| Code | Type | Used by |
|---|---|---|
| CASH_AT_PAYMENT_PROVIDER | ASSET | fund escrow (Dr), refunds (Cr), withdrawals paid (Cr) |
| ESCROW_HOLDING | LIABILITY | fund (Cr), release/refund (Dr) |
| CUSTOMER_WALLETS_PAYABLE | LIABILITY | not used by current code |
| PROVIDER_WALLETS_PAYABLE | LIABILITY | release (Cr), withdrawal paid (Dr) |
| TAX_PAYABLE | LIABILITY | not used |
| PLATFORM_REVENUE | REVENUE | not used |
| COMMISSION_REVENUE | REVENUE | release commission (Cr) |
| PROCESSING_FEE_EXPENSE | EXPENSE | not used |

Postings:
- **Fund escrow**: Dr CASH_AT_PAYMENT_PROVIDER / Cr ESCROW_HOLDING (+ `ESCROW_HOLD` transaction).
- **Release**: Dr ESCROW_HOLDING / Cr PROVIDER_WALLETS_PAYABLE (provider share, `ESCROW_RELEASE`) and Dr ESCROW_HOLDING / Cr COMMISSION_REVENUE (`COMMISSION`); wallet AVAILABLE += provider share.
- **Withdrawal**: request moves AVAILABLE → LOCKED in `WalletBalance`; mark-paid posts Dr PROVIDER_WALLETS_PAYABLE / Cr CASH_AT_PAYMENT_PROVIDER; reject/failed returns LOCKED → AVAILABLE.

Constraints worth knowing:
- `LedgerAccount.code` is globally unique and each account has one currency ⇒ **one currency per platform** today; a second region/currency needs per-currency account codes.
- No DB-level transactions wrap a posting + wallet update (see bugs).
- Ledger invariant is application-enforced (no trigger). Reports: `/api/v1/admin/finance/reports/trial-balance`, `/reconciliation` compare ledger vs wallet balances.

## 5. Notable indexes / uniques

`User.phone`, `User.email`, `RefreshToken.tokenHash`, `Escrow(relatedEntityType, relatedEntityId)`,
`PaymentTransaction.idempotencyKey`, `JournalEntry.idempotencyKey`, `WalletBalance(walletId,bucket)`,
`Wallet.userId`, `Wallet.companyId`, `ProviderProfile.userId`, `CompanyMember(companyId,userId)`,
`RemoteConfigEntry(key, regionId)` (note: Postgres treats NULL regionIds as distinct, so duplicate global keys are not prevented by the DB),
`WorkflowDefinition(key, version)`. Composite indexes exist on status/foreign-key columns for all list queries.
