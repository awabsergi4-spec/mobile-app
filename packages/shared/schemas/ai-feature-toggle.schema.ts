import { z } from "zod";

// Matches AiCapability in apps/backend/prisma/schema.prisma.
export const aiCapabilitySchema = z.enum([
  "INTENT_CLASSIFICATION",
  "RANKING_ADJUSTMENT",
  "RECOMMENDATION",
  "FRAUD_DETECTION",
  "DEMAND_FORECAST",
  "PRICING_SUGGESTION",
  "ASSISTANT_CUSTOMER",
  "ASSISTANT_PROVIDER",
  "ASSISTANT_ADMIN",
]);

export const setAiFeatureToggleSchema = z.object({
  capability: aiCapabilitySchema,
  isEnabled: z.boolean(),
  provider: z.string().min(1).max(60),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type SetAiFeatureTogglePayload = z.infer<typeof setAiFeatureToggleSchema>;
