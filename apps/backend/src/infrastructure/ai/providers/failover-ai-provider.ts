import type {
  AIProvider,
  EmbeddingRequest,
  EmbeddingResult,
  IntentClassificationRequest,
  IntentClassificationResult,
  StructuredJsonRequest,
  StructuredJsonResult,
  TextGenerationRequest,
  TextGenerationResult,
} from "@/domain/ai/provider/ai-provider";

// Composite that itself implements AIProvider — callers hold one AIProvider
// reference and never know failover happened. Tries each provider in the
// configured chain in order; on failure, moves to the next. Throws only if
// every provider in the chain fails. See ADR-006.
export class FailoverAIProvider implements AIProvider {
  readonly name = "failover";

  constructor(private readonly chain: AIProvider[]) {
    if (chain.length === 0) {
      throw new Error("FailoverAIProvider requires at least one provider in the chain");
    }
  }

  generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    return this.withFailover((provider) => provider.generateText(request));
  }

  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResult> {
    return this.withFailover((provider) => provider.generateEmbeddings(request));
  }

  classifyIntent(request: IntentClassificationRequest): Promise<IntentClassificationResult> {
    return this.withFailover((provider) => provider.classifyIntent(request));
  }

  generateStructuredJson<T>(request: StructuredJsonRequest): Promise<StructuredJsonResult<T>> {
    return this.withFailover((provider) => provider.generateStructuredJson<T>(request));
  }

  private async withFailover<T>(operation: (provider: AIProvider) => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (const provider of this.chain) {
      try {
        return await operation(provider);
      } catch (err) {
        // A real deployment logs `provider.name` + err here (structured
        // logging per docs/00-system-architecture.md) before falling
        // through — omitted here to keep this skeleton dependency-free.
        lastError = err;
      }
    }

    throw lastError;
  }
}
