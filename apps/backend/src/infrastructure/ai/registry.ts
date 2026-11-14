import type { PrismaClient } from "@prisma/client";
import type { IntentClassifier } from "@/domain/ai/intent-classifier";
import { KeywordIntentClassifier } from "./rule-based/keyword-intent-classifier";
import { LlmIntentClassifier } from "./llm/llm-intent-classifier";
import { AiProviderRegistry } from "./providers/ai-provider-registry";

// Resolves which implementation of a given AI capability is active, from
// AiFeatureToggle — the same "registry keyed by config, not a hardcoded
// switch in business logic" pattern as the payment gateway resolution in
// ADR-001. Application-layer use cases depend on the domain/ai interface
// only; they call AiRegistry to get an instance, they never import a
// concrete infrastructure/ai/* class directly.
//
// Only IntentClassifier is wired here as the reference implementation
// (ADR-005 + ADR-006) — the other five capability interfaces follow the
// identical shape: look up the AiFeatureToggle row, fall back to
// rule-based when disabled or unconfigured, otherwise build an LLM-backed
// implementation from an AIProvider resolved through AiProviderRegistry.
export class AiRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  async getIntentClassifier(): Promise<IntentClassifier> {
    const toggle = await this.prisma.aiFeatureToggle.findUnique({
      where: { capability: "INTENT_CLASSIFICATION" },
    });

    if (!toggle?.isEnabled || toggle.provider === "rule-based") {
      return new KeywordIntentClassifier();
    }

    // Any non-"rule-based" provider value means "use the LLM-backed
    // implementation" — which vendor (openai-compatible, anthropic, ...)
    // is AiProviderConfig's concern (ADR-006), not this capability-level
    // toggle's. LlmIntentClassifier never knows which vendor it got.
    const aiProvider = await new AiProviderRegistry(this.prisma).resolve();
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: { translations: { where: { locale: "en" } } },
    });
    const candidateCategories = categories.map((category) => ({
      id: category.id,
      description: category.translations[0]?.name ?? category.id,
    }));

    return new LlmIntentClassifier(aiProvider, candidateCategories);
  }
}
