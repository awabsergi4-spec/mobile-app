import type { PrismaClient, Prisma } from "@prisma/client";
import type { TargetingRules } from "@sahl/shared/schemas/targeting.schema";

// segmentId has no backing model in the schema (no Segment/audience-list
// entity exists yet) — thrown rather than silently ignored, since silently
// dropping a targeting constraint would broadcast to a wider audience than
// the admin intended.
export class UnsupportedTargetingRuleError extends Error {
  constructor() {
    super('Targeting by "segmentId" is not supported — no Segment model exists in the schema yet.');
  }
}

// Resolves the shared targetingRules shape (ADR-007 §1,
// packages/shared/schemas/targeting.schema.ts) against real User /
// ProviderProfile rows — no hardcoded audience lists. Every array field is
// OR-within-itself, AND-across-fields, per the shared schema's contract.
export class NotificationTargetResolver {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveUserIds(rules: TargetingRules | null | undefined): Promise<string[]> {
    if (rules?.segmentId) {
      throw new UnsupportedTargetingRuleError();
    }

    const where: Prisma.UserWhereInput = { status: "ACTIVE" };

    if (rules?.countryCodes?.length) {
      where.country = { in: rules.countryCodes };
    }
    if (rules?.cityNames?.length) {
      where.city = { in: rules.cityNames };
    }
    if (rules?.languages?.length) {
      where.preferredLanguage = { in: rules.languages };
    }
    if (rules?.userIds?.length) {
      where.id = { in: rules.userIds };
    }

    const rolesWantCustomer = !rules?.userRoles?.length || rules.userRoles.includes("CUSTOMER");
    const rolesWantProvider = !rules?.userRoles?.length || rules.userRoles.includes("PROVIDER");
    const needsProviderJoin = Boolean(rules?.serviceCategoryIds?.length || rules?.providerType);

    if (needsProviderJoin && !rolesWantProvider) {
      // A providerType/serviceCategoryIds constraint only matches providers
      // — combined with an explicit CUSTOMER-only userRoles filter, that's
      // a contradiction and correctly matches nobody (AND semantics).
      where.id = { in: [] };
    } else if (needsProviderJoin) {
      where.providerProfile = {
        is: {
          ...(rules?.providerType === "COMPANY" ? { companyId: { not: null } } : {}),
          ...(rules?.providerType === "INDIVIDUAL" ? { companyId: null } : {}),
          ...(rules?.serviceCategoryIds?.length
            ? { categories: { some: { categoryId: { in: rules.serviceCategoryIds } } } }
            : {}),
        },
      };
    } else if (!rolesWantCustomer && rolesWantProvider) {
      where.providerProfile = { isNot: null };
    } else if (rolesWantCustomer && !rolesWantProvider) {
      where.providerProfile = null;
    }

    const users = await this.prisma.user.findMany({ where, select: { id: true } });
    return users.map((u) => u.id);
  }
}
