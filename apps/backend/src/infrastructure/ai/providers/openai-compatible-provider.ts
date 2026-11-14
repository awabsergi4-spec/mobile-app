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

export interface OpenAiCompatibleConfig {
  // Same wire protocol at all of these — OpenAI, Azure OpenAI, Groq,
  // Together.ai, and local vLLM/Ollama OpenAI-compatibility endpoints all
  // work through this one adapter via baseUrl. See ADR-006.
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  defaultEmbeddingModel?: string;
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class OpenAiCompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: OpenAiCompatibleConfig) {}

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const response = await this.chatCompletion({
      model: request.model ?? this.config.defaultModel,
      messages: this.buildMessages(request.systemPrompt, request.prompt),
      max_tokens: request.maxTokens,
      temperature: request.temperature,
    });

    return {
      text: response.choices[0].message.content,
      model: response.model,
      usage: response.usage && {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
      },
    };
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResult> {
    const response = await this.post("/embeddings", {
      model: request.model ?? this.config.defaultEmbeddingModel ?? this.config.defaultModel,
      input: request.input,
    });
    const json = await response.json();

    return {
      vectors: json.data.map((entry: { embedding: number[] }) => entry.embedding),
      model: json.model,
      dimensions: json.data[0]?.embedding.length ?? 0,
    };
  }

  async classifyIntent(request: IntentClassificationRequest): Promise<IntentClassificationResult> {
    // No dedicated "classify" endpoint on the OpenAI-compatible wire
    // protocol — composed from generateStructuredJson, per ADR-006.
    const result = await this.generateStructuredJson<IntentClassificationResult>({
      prompt: [
        "Classify the following text into exactly one of the candidate labels.",
        `Text: ${request.text}`,
        `Candidates: ${request.candidateLabels.map((c) => `${c.id}: ${c.description}`).join("; ")}`,
      ].join("\n"),
      jsonSchema: {
        type: "object",
        properties: {
          labelId: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["labelId", "confidence"],
      },
    });

    return result.data;
  }

  async generateStructuredJson<T>(request: StructuredJsonRequest): Promise<StructuredJsonResult<T>> {
    const response = await this.chatCompletion({
      model: request.model ?? this.config.defaultModel,
      messages: this.buildMessages(request.systemPrompt, request.prompt),
      response_format: { type: "json_schema", json_schema: request.jsonSchema },
    });

    return {
      data: JSON.parse(response.choices[0].message.content) as T,
      model: response.model,
    };
  }

  private buildMessages(systemPrompt: string | undefined, prompt: string): ChatMessage[] {
    const messages: ChatMessage[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });
    return messages;
  }

  private async chatCompletion(body: Record<string, unknown>) {
    const response = await this.post("/chat/completions", body);
    return response.json();
  }

  private post(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }
}
