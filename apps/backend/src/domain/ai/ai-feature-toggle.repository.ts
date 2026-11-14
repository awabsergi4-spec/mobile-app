import type { AiCapability, AiFeatureToggle } from "./ai-feature-toggle.entity";

export interface SetAiFeatureToggleInput {
  capability: AiCapability;
  isEnabled: boolean;
  provider: string;
  config?: Record<string, unknown> | null;
}

// Interface only — implemented in infrastructure/ai/prisma-ai-feature-toggle.repository.ts.
// Distinct from the capability interfaces in domain/ai/*.ts (IntentClassifier
// etc., which application use cases call) — this is admin-facing CRUD over
// the AiFeatureToggle config rows those capability lookups read from.
export interface AiFeatureToggleRepository {
  // Returns one row per AiCapability enum value, always — a capability with
  // no DB row yet is synthesized with isEnabled: false, provider:
  // "rule-based", matching AiRegistry's own fallback semantics, so the
  // admin UI never shows a capability as missing.
  listAll(): Promise<AiFeatureToggle[]>;
  findByCapability(capability: AiCapability): Promise<AiFeatureToggle | null>;
  // Upsert keyed by the unique `capability` column.
  set(input: SetAiFeatureToggleInput): Promise<AiFeatureToggle>;
}
