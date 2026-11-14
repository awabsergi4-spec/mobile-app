import type { PrismaClient } from "@prisma/client";
import type { CommissionCalculator, CommissionResult, ResolveCommissionInput } from "@/domain/finance/commission-calculator";

// Specificity order: provider-specific overrides everything (a negotiated
// rate for one provider), then subscription-plan (a premium tier's
// discounted rate), then category, then the platform-wide default
// (categoryId/providerId/subscriptionPlanId all null). Only the first
// match in this order is used — rules don't stack.
export class PrismaCommissionCalculator implements CommissionCalculator {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(input: ResolveCommissionInput): Promise<CommissionResult> {
    const candidates = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [
          input.providerId ? { providerId: input.providerId } : undefined,
          input.subscriptionPlanId ? { subscriptionPlanId: input.subscriptionPlanId } : undefined,
          input.categoryId ? { categoryId: input.categoryId } : undefined,
          { providerId: null, subscriptionPlanId: null, categoryId: null },
        ].filter((clause): clause is NonNullable<typeof clause> => clause !== undefined),
      },
    });

    const rule =
      candidates.find((c) => input.providerId && c.providerId === input.providerId) ??
      candidates.find((c) => input.subscriptionPlanId && c.subscriptionPlanId === input.subscriptionPlanId) ??
      candidates.find((c) => input.categoryId && c.categoryId === input.categoryId) ??
      candidates.find((c) => c.providerId === null && c.subscriptionPlanId === null && c.categoryId === null);

    if (!rule) {
      return { commissionAmount: 0, commissionPercentage: 0, ruleId: null };
    }

    let commissionAmount = Math.round(input.amount * (rule.percentage / 100)) + rule.flatFee;
    if (rule.minFeeMinorUnits != null) commissionAmount = Math.max(commissionAmount, rule.minFeeMinorUnits);
    if (rule.maxFeeMinorUnits != null) commissionAmount = Math.min(commissionAmount, rule.maxFeeMinorUnits);
    commissionAmount = Math.max(0, Math.min(commissionAmount, input.amount));

    return {
      commissionAmount,
      commissionPercentage: input.amount > 0 ? (commissionAmount / input.amount) * 100 : 0,
      ruleId: rule.id,
    };
  }
}
