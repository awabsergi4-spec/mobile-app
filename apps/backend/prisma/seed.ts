import { PrismaClient, ServiceType, AiCapability, LedgerAccountType } from "@prisma/client";
import { Argon2PasswordHasher } from "../src/infrastructure/identity/argon2-password-hasher";

const prisma = new PrismaClient();
const passwordHasher = new Argon2PasswordHasher();

// Initial seeded region — Sudan. See docs/02-architecture.md ADR-001:
// this is a data row, not a code path; adding another country means
// inserting another Region, not branching logic.
async function seedRegion() {
  return prisma.region.upsert({
    where: { code: "SD" },
    update: {},
    create: {
      code: "SD",
      name: "Sudan",
      defaultCurrency: "SDG",
      defaultLanguage: "ar",
      isActive: true,
    },
  });
}

// A handful of starter categories across all three service types, per
// docs/01-product-overview.md §4. Not exhaustive — real taxonomy is an
// admin-managed data set, this just makes the app usable for dev/testing.
async function seedCategories() {
  const starter: { type: ServiceType; en: string; ar: string }[] = [
    { type: "ON_DEMAND", en: "Towing", ar: "سحب السيارات" },
    { type: "ON_DEMAND", en: "Plumbing", ar: "سباكة" },
    { type: "ON_DEMAND", en: "Electrical", ar: "كهرباء" },
    { type: "CONTRACT", en: "Construction", ar: "مقاولات" },
    { type: "CONTRACT", en: "Legal Consultation", ar: "استشارات قانونية" },
    { type: "REMOTE", en: "Programming", ar: "برمجة" },
    { type: "REMOTE", en: "Graphic Design", ar: "تصميم جرافيك" },
  ];

  for (const item of starter) {
    const existing = await prisma.serviceCategory.findFirst({
      where: { type: item.type, translations: { some: { locale: "en", name: item.en } } },
    });
    if (existing) continue;

    await prisma.serviceCategory.create({
      data: {
        type: item.type,
        translations: {
          create: [
            { locale: "en", name: item.en },
            { locale: "ar", name: item.ar },
          ],
        },
      },
    });
  }
}

// All nine capabilities seeded explicitly disabled, provider "rule-based" —
// see ADR-005 (docs/02-architecture.md §9). This makes "AI ready" a real,
// visible row per capability rather than an implicit absence; turning one
// on later is an update to this row, not a schema change.
async function seedAiFeatureToggles() {
  for (const capability of Object.values(AiCapability)) {
    await prisma.aiFeatureToggle.upsert({
      where: { capability },
      update: {},
      create: { capability, isEnabled: false, provider: "rule-based" },
    });
  }
}

// Every permission key any route/admin-page checks via requirePermission/
// requireAdminPermission, in one place — this is the actual source of
// truth for "what admin capabilities exist," not a doc. A SUPER_ADMIN role
// holding all of them lets a real operator (granted via UserStaffRole,
// itself not seeded here — see docs/00-admin-panel-spec.md) reach every
// Admin Platform module; narrower roles (SUPPORT, FINANCE_OFFICER, etc.)
// are expected to be composed from this same permission set later, not
// invented ad hoc per screen.
const ADMIN_PERMISSION_KEYS = [
  "dashboard.view",
  "users.manage",
  "providers.manage",
  "companies.manage",
  "services.manage",
  "advertisements.manage",
  "notifications.manage",
  "promotions.manage",
  "config.manage",
  "ai.manage",
  "workflows.manage",
  "contracts.manage",
  "remote.manage",
  "finance.manage",
  "audit.view",
];

async function seedRbac() {
  const permissions = await Promise.all(
    ADMIN_PERMISSION_KEYS.map((key) => prisma.permission.upsert({ where: { key }, update: {}, create: { key } })),
  );

  const superAdminRole = await prisma.staffRole.upsert({
    where: { key: "SUPER_ADMIN" },
    update: {},
    create: { key: "SUPER_ADMIN", name: "Super Admin" },
  });

  for (const permission of permissions) {
    await prisma.staffRolePermission.upsert({
      where: { staffRoleId_permissionId: { staffRoleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { staffRoleId: superAdminRole.id, permissionId: permission.id },
    });
  }
}

// The chart of accounts the Financial Core's ledger use cases expect to
// already exist (see the LedgerAccount model comment in schema.prisma and
// ADR-008) — CASH_AT_PAYMENT_PROVIDER/ESCROW_HOLDING/PROVIDER_WALLETS_PAYABLE/
// COMMISSION_REVENUE are read by application/finance/*.use-case.ts today;
// the other four are the documented chart's remaining accounts. Without
// these rows every ledger posting throws LedgerAccountNotFoundError.
async function seedLedgerAccounts(currency: string, regionId: string) {
  const accounts: { code: string; name: string; type: LedgerAccountType }[] = [
    { code: "CASH_AT_PAYMENT_PROVIDER", name: "Cash at Payment Provider", type: "ASSET" },
    { code: "ESCROW_HOLDING", name: "Escrow Holding", type: "LIABILITY" },
    { code: "CUSTOMER_WALLETS_PAYABLE", name: "Customer Wallets Payable", type: "LIABILITY" },
    { code: "PROVIDER_WALLETS_PAYABLE", name: "Provider Wallets Payable", type: "LIABILITY" },
    { code: "TAX_PAYABLE", name: "Tax Payable", type: "LIABILITY" },
    { code: "PLATFORM_REVENUE", name: "Platform Revenue", type: "REVENUE" },
    { code: "COMMISSION_REVENUE", name: "Commission Revenue", type: "REVENUE" },
    { code: "PROCESSING_FEE_EXPENSE", name: "Processing Fee Expense", type: "EXPENSE" },
  ];

  for (const account of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      update: {},
      create: { ...account, currency, regionId },
    });
  }
}

// One bootstrap SUPER_ADMIN operator account — there is no self-service way
// to become staff (UserStaffRole is never granted through a public API, by
// design), so the very first admin has to be seeded directly rather than
// registered through the normal OTP flow. Created ACTIVE (not
// PENDING_VERIFICATION) since login-with-password requires ACTIVE status.
// Dev-only credentials, overridable via env so a real deployment can set
// its own before first seed run instead of relying on the fallback.
async function seedBootstrapAdmin(regionId: string) {
  const phone = process.env.SEED_ADMIN_PHONE ?? "+249900000000";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing) {
    const passwordHash = await passwordHasher.hash(password);
    await prisma.user.create({
      data: {
        phone,
        passwordHash,
        fullName: "SAHL Super Admin",
        preferredLanguage: "en",
        status: "ACTIVE",
        regionId,
      },
    });
  }

  const superAdminRole = await prisma.staffRole.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
  const user = await prisma.user.findUniqueOrThrow({ where: { phone } });

  await prisma.userStaffRole.upsert({
    where: { userId_staffRoleId: { userId: user.id, staffRoleId: superAdminRole.id } },
    update: {},
    create: { userId: user.id, staffRoleId: superAdminRole.id },
  });
}

async function main() {
  const region = await seedRegion();
  await seedCategories();
  await seedAiFeatureToggles();
  await seedRbac();
  await seedLedgerAccounts(region.defaultCurrency, region.id);
  await seedBootstrapAdmin(region.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
