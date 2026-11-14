export type AiCapability =
  | "INTENT_CLASSIFICATION"
  | "RANKING_ADJUSTMENT"
  | "RECOMMENDATION"
  | "FRAUD_DETECTION"
  | "DEMAND_FORECAST"
  | "PRICING_SUGGESTION"
  | "ASSISTANT_CUSTOMER"
  | "ASSISTANT_PROVIDER"
  | "ASSISTANT_ADMIN";

export const AI_CAPABILITIES: AiCapability[] = [
  "INTENT_CLASSIFICATION",
  "RANKING_ADJUSTMENT",
  "RECOMMENDATION",
  "FRAUD_DETECTION",
  "DEMAND_FORECAST",
  "PRICING_SUGGESTION",
  "ASSISTANT_CUSTOMER",
  "ASSISTANT_PROVIDER",
  "ASSISTANT_ADMIN",
];

export interface AiFeatureToggle {
  id: string | null; // null when no row exists yet for this capability — defaults apply (see AiFeatureToggleRepository.listAll)
  capability: AiCapability;
  isEnabled: boolean;
  provider: string;
  config: Record<string, unknown> | null;
  updatedAt: Date | null;
}
