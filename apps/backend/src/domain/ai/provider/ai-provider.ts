// Vendor-agnostic AI provider abstraction — see ADR-006 in
// docs/02-architecture.md. This is the layer below domain/ai/'s capability
// interfaces (ADR-005): capability implementations (e.g. a future
// LlmIntentClassifier) depend on AIProvider, never on a concrete vendor SDK.
// infrastructure/ai/providers/<vendor>/ holds the adapters that implement
// this interface per vendor.

export interface TextGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string; // overrides the provider's configured default model
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationResult {
  text: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResult {
  vectors: number[][];
  model: string;
  dimensions: number;
}

export interface IntentClassificationRequest {
  text: string;
  candidateLabels: { id: string; description: string }[];
  locale?: string;
}

export interface IntentClassificationResult {
  labelId: string;
  confidence: number;
}

export interface StructuredJsonRequest {
  prompt: string;
  systemPrompt?: string;
  jsonSchema: unknown; // JSON Schema describing the desired output shape
  model?: string;
}

export interface StructuredJsonResult<T = unknown> {
  data: T;
  model: string;
}

export interface ImageUnderstandingRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageUnderstandingResult {
  description: string;
}

export interface SpeechToTextRequest {
  audioUrl: string;
  locale?: string;
}

export interface SpeechToTextResult {
  text: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: string;
}

export interface TextToSpeechResult {
  audioUrl: string;
}

export interface AIProvider {
  /** Adapter identity, e.g. "openai-compatible" — used in logs and error messages, not for branching in callers. */
  readonly name: string;

  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResult>;
  classifyIntent(request: IntentClassificationRequest): Promise<IntentClassificationResult>;
  generateStructuredJson<T>(request: StructuredJsonRequest): Promise<StructuredJsonResult<T>>;

  // Optional, not mandatory-with-a-throw-stub: an adapter that doesn't
  // support a future capability simply omits the method; callers check for
  // presence (`provider.understandImage?.(...)`) rather than catching a
  // "not supported" error. See ADR-006 for why.
  understandImage?(request: ImageUnderstandingRequest): Promise<ImageUnderstandingResult>;
  speechToText?(request: SpeechToTextRequest): Promise<SpeechToTextResult>;
  textToSpeech?(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
}
