// The seam docs/05-security.md §6's MVP heuristics (velocity checks,
// duplicate-device flags) eventually plug into — see the note there and
// ADR-005. entityType/entityId is deliberately generic (mirrors the
// PaymentTransaction/Dispute polymorphic-reference convention) since fraud
// evaluation applies across users, providers, requests, and transactions.
export interface FraudSignal {
  riskScore: number; // 0..1
  reasons: string[];
}

export interface FraudSignalProvider {
  evaluate(entityType: string, entityId: string, context: Record<string, unknown>): Promise<FraudSignal>;
}
