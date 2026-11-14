import type { PrismaClient } from "@prisma/client";
import type { AIProvider } from "@/domain/ai/provider/ai-provider";
import { OpenAiCompatibleProvider } from "./openai-compatible-provider";
import { FailoverAIProvider } from "./failover-ai-provider";

// Builds the active AIProvider — a single adapter, or a FailoverAIProvider
// chain across every active AiProviderConfig row in `priority` order — from
// config. Same "registry keyed by config, not a hardcoded switch in
// business logic" pattern as PaymentProvider (ADR-001) and the
// capability-level AiRegistry (ADR-005). Capability implementations depend
// on AIProvider, resolved through this registry — never on a concrete
// adapter class. See ADR-006.
export class AiProviderRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(): Promise<AIProvider> {
    const configs = await this.prisma.aiProviderConfig.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" },
    });

    if (configs.length === 0) {
      throw new Error("No active AiProviderConfig — AI-backed capabilities have no provider to resolve");
    }

    const chain = configs.map((entry) => this.build(entry.provider, entry.model, entry.config));
    // configs.length === 0 already threw above, so chain[0] is always
    // defined here — noUncheckedIndexedAccess just can't see that.
    return chain.length === 1 ? chain[0]! : new FailoverAIProvider(chain);
  }

  private build(provider: string, model: string, config: unknown): AIProvider {
    switch (provider) {
      case "openai-compatible":
        return new OpenAiCompatibleProvider({
          ...(config as { baseUrl: string; apiKey: string }),
          defaultModel: model,
        });
      // "anthropic" | "gemini" | "ollama" register here as their adapters
      // are built (ADR-006) — additive, never a change to this registry's
      // callers or to any capability implementation.
      default:
        throw new Error(`AI provider "${provider}" has no adapter registered`);
    }
  }
}
