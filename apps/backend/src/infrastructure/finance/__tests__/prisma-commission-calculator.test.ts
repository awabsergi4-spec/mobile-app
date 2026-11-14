import { describe, it, expect } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaCommissionCalculator } from "../prisma-commission-calculator";

// Real production class under test — CommissionRule rows are supplied via
// a minimal mocked PrismaClient (only commissionRule.findMany is used by
// PrismaCommissionCalculator.resolve), so this exercises the actual
// precedence + clamping math, not a hand-rolled stand-in for it.
type Rule = {
  id: string;
  providerId: string | null;
  subscriptionPlanId: string | null;
  categoryId: string | null;
  percentage: number;
  flatFee: number;
  minFeeMinorUnits: number | null;
  maxFeeMinorUnits: number | null;
  isActive: boolean;
};

function prismaWithRules(rules: Rule[]): PrismaClient {
  return {
    commissionRule: {
      findMany: async ({ where }: { where: { isActive: boolean; OR: unknown[] } }) =>
        rules.filter((r) => r.isActive === where.isActive),
    },
  } as unknown as PrismaClient;
}

describe("PrismaCommissionCalculator", () => {
  it("returns zero commission when no rule matches at all", async () => {
    const calculator = new PrismaCommissionCalculator(prismaWithRules([]));
    const result = await calculator.resolve({ amount: 10000 });
    expect(result).toEqual({ commissionAmount: 0, commissionPercentage: 0, ruleId: null });
  });

  it("applies the platform-wide default rule (all scoping fields null) when nothing more specific matches", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "default", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 10, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    const result = await calculator.resolve({ amount: 10000 });
    expect(result).toEqual({ commissionAmount: 1000, commissionPercentage: 10, ruleId: "default" });
  });

  it("prefers a provider-specific rule over category and the platform default", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "default", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 15, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
        { id: "category", providerId: null, subscriptionPlanId: null, categoryId: "cat-1", percentage: 12, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
        { id: "provider", providerId: "provider-1", subscriptionPlanId: null, categoryId: null, percentage: 5, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    const result = await calculator.resolve({ amount: 10000, providerId: "provider-1", categoryId: "cat-1" });
    expect(result.ruleId).toBe("provider");
    expect(result.commissionAmount).toBe(500);
  });

  it("prefers a subscription-plan rule over category when no provider-specific rule exists", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "category", providerId: null, subscriptionPlanId: null, categoryId: "cat-1", percentage: 12, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
        { id: "plan", providerId: null, subscriptionPlanId: "plan-1", categoryId: null, percentage: 8, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    const result = await calculator.resolve({ amount: 10000, subscriptionPlanId: "plan-1", categoryId: "cat-1" });
    expect(result.ruleId).toBe("plan");
  });

  it("clamps the computed fee up to minFeeMinorUnits when percentage+flat falls below it", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "r", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 1, flatFee: 0, minFeeMinorUnits: 500, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    // 1% of 1000 = 10, below the 500 floor.
    const result = await calculator.resolve({ amount: 1000 });
    expect(result.commissionAmount).toBe(500);
  });

  it("clamps the computed fee down to maxFeeMinorUnits when percentage+flat exceeds it", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "r", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 50, flatFee: 0, minFeeMinorUnits: null, maxFeeMinorUnits: 2000, isActive: true },
      ]),
    );
    // 50% of 10000 = 5000, above the 2000 ceiling.
    const result = await calculator.resolve({ amount: 10000 });
    expect(result.commissionAmount).toBe(2000);
  });

  it("never returns a commission greater than the base amount, even with a runaway flat fee", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "r", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 0, flatFee: 999999, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    const result = await calculator.resolve({ amount: 1000 });
    expect(result.commissionAmount).toBe(1000);
  });

  it("adds flatFee on top of the percentage-based amount", async () => {
    const calculator = new PrismaCommissionCalculator(
      prismaWithRules([
        { id: "r", providerId: null, subscriptionPlanId: null, categoryId: null, percentage: 10, flatFee: 200, minFeeMinorUnits: null, maxFeeMinorUnits: null, isActive: true },
      ]),
    );
    const result = await calculator.resolve({ amount: 10000 });
    expect(result.commissionAmount).toBe(1200);
  });
});
