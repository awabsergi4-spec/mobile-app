// One interface for the AI customer/provider/admin assistants — they differ
// in system prompt, context, and which actions they're allowed to suggest,
// not in call shape. Three near-identical interfaces here would be exactly
// the duplicated logic the architecture rules prohibit (docs/00-master-prompt.md
// §Architecture Rules). Per-persona behavior is an infrastructure/ai/*
// implementation detail (prompt/config), not a domain-layer concern.
export type AssistantPersona = "CUSTOMER" | "PROVIDER" | "ADMIN";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SuggestedAction {
  label: string;
  actionKey: string;
}

export interface AssistantResponse {
  reply: string;
  suggestedActions?: SuggestedAction[];
}

export interface ConversationalAssistant {
  respond(
    persona: AssistantPersona,
    history: AssistantMessage[],
    context: Record<string, unknown>,
  ): Promise<AssistantResponse>;
}
