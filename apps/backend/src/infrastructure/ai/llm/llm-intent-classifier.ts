import type { AIProvider } from "@/domain/ai/provider/ai-provider";
import type { ClassifiedIntent, IntentClassifier } from "@/domain/ai/intent-classifier";

// Demonstrates how a domain/ai/ capability interface (ADR-005) is
// implemented on top of the vendor-agnostic AIProvider (ADR-006): this
// class depends only on AIProvider, never on a concrete adapter — swapping
// OpenAiCompatibleProvider for an Anthropic or local-LLM adapter later
// requires zero changes here.
export class LlmIntentClassifier implements IntentClassifier {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly candidateCategories: { id: string; description: string }[],
  ) {}

  async classify(freeText: string, locale: string): Promise<ClassifiedIntent> {
    const result = await this.aiProvider.classifyIntent({
      text: freeText,
      candidateLabels: this.candidateCategories,
      locale,
    });

    return {
      categoryId: result.labelId,
      confidence: result.confidence,
      // Emergency detection from free text is a follow-up refinement (a
      // second classifyIntent-style call, or extending the schema) — not
      // blocking this reference wiring of the capability -> provider chain.
      urgency: "NORMAL",
    };
  }
}
