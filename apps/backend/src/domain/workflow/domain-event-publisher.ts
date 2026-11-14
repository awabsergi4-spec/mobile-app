// Interface only — application-layer use cases publish through this after
// completing their own work (e.g. ReleaseEscrowUseCase publishes
// EscrowReleased). Publishing is a small, additive side effect on an
// existing use case, not a rewrite of it. See ADR-009.
export interface PublishDomainEventInput {
  type: string; // e.g. "EscrowReleased" — free string, see ADR-009
  payload: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface DomainEventPublisher {
  publish(input: PublishDomainEventInput): Promise<{ eventId: string }>;
}
