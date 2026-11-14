// Interface only — resolves the applicable CommissionRule and computes
// the fee, so ReleaseEscrowUseCase's caller never re-implements
// percentage/flat/min/max math or rule-precedence logic inline. Respects
// ADR-007: CommissionRule stays a real relational model (not flattened
// into RemoteConfigEntry) precisely so this resolution can be a proper
// query, not a JSON blob parse.
export interface ResolveCommissionInput {
  amount: number; // minor units — the base amount commission applies to
  categoryId?: string;
  providerId?: string;
  subscriptionPlanId?: string;
}

export interface CommissionResult {
  commissionAmount: number; // minor units, already percentage+flat, clamped to min/max
  commissionPercentage: number; // effective percentage (commissionAmount / amount * 100), for callers that need a rate rather than an amount
  ruleId: string | null; // null when no active rule matched — commissionAmount is 0
}

export interface CommissionCalculator {
  resolve(input: ResolveCommissionInput): Promise<CommissionResult>;
}
