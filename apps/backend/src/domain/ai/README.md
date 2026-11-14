# domain/ai/

Interface-only contracts for the nine AI capabilities named in
[00-system-architecture.md](../../../../docs/00-system-architecture.md), consolidated to six
interfaces where the call shape is genuinely the same. See
[ADR-005](../../../../docs/02-architecture.md#9-adr-005-ai-integration-layer) for the full
reasoning.

Rules — same as every other `domain/` module:
- No AI SDK imports here. Ever.
- Every interface has at least one `infrastructure/ai/rule-based/` implementation requiring no AI service, so a disabled capability degrades gracefully instead of breaking its caller.
- Application-layer use cases depend on these interfaces, resolved through `infrastructure/ai/registry.ts` — never on a concrete AI SDK class.

| Interface | File |
|---|---|
| `IntentClassifier` | [intent-classifier.ts](intent-classifier.ts) |
| `RankingAdjuster` | [ranking-adjuster.ts](ranking-adjuster.ts) |
| `RecommendationProvider` | [recommendation-provider.ts](recommendation-provider.ts) |
| `FraudSignalProvider` | [fraud-signal-provider.ts](fraud-signal-provider.ts) |
| `DemandForecastProvider` | [demand-forecast-provider.ts](demand-forecast-provider.ts) |
| `PricingSuggestionProvider` | [pricing-suggestion-provider.ts](pricing-suggestion-provider.ts) |
| `ConversationalAssistant` | [conversational-assistant.ts](conversational-assistant.ts) |

## provider/

A second, lower-level layer: [`provider/ai-provider.ts`](provider/ai-provider.ts)'s `AIProvider` is the vendor-agnostic interface an LLM-backed implementation of any capability above depends on (text generation, embeddings, intent classification, structured JSON, plus optional image/speech methods). See [ADR-006](../../../../docs/02-architecture.md#10-adr-006-ai-provider-abstraction) for why this is a separate interface rather than folded into the capability interfaces themselves. Vendor adapters (`OpenAiCompatibleProvider`, and future Anthropic/Gemini/local-LLM adapters) live in `infrastructure/ai/providers/`, resolved with failover by `infrastructure/ai/providers/ai-provider-registry.ts`.
