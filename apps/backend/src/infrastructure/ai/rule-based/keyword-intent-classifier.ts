import type { ClassifiedIntent, IntentClassifier } from "@/domain/ai/intent-classifier";

// Default implementation of IntentClassifier — requires no AI service, so
// natural language search works from day one. Swappable for a model-backed
// implementation later purely via infrastructure/ai/registry.ts; no
// application-layer code changes when that happens (ADR-005).
//
// Real keyword -> categoryId matching is seed/config data
// (ServiceCategoryTranslation, docs/03-database-schema.md), not hardcoded
// here — this stub keeps the interface's shape correct without pretending
// to be a complete taxonomy match.
const EMERGENCY_KEYWORDS = ["emergency", "urgent", "asap", "طوارئ", "عاجل", "ضروري"];

export class KeywordIntentClassifier implements IntentClassifier {
  async classify(freeText: string, _locale: string): Promise<ClassifiedIntent> {
    const normalized = freeText.toLowerCase();
    const isEmergency = EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));

    return {
      categoryId: "unknown", // real lookup against seeded categories belongs in the use case, not this default
      confidence: 0.3,
      urgency: isEmergency ? "EMERGENCY" : "NORMAL",
    };
  }
}
