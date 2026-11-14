import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidProviderLifecycleTransitionError, ProviderProfileNotFoundError } from "./errors";

export interface SuspendProviderInput {
  providerId: string;
  reason: string;
  actorId: string;
}

// Mirrors ReleaseEscrowUseCase's shape (ADR-009): the state transition is
// owned here by the ProviderProfile's own lifecycle, and publishing
// ProviderSuspended is the one additive side effect that lets a future
// WorkflowDefinition/AutomationRule react to it — no new orchestration
// mechanism invented.
export class SuspendProviderUseCase {
  constructor(
    private readonly providers: ProviderProfileRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: SuspendProviderInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }
    if (provider.status === "DELETED") {
      throw new InvalidProviderLifecycleTransitionError("DELETED", "SUSPENDED");
    }

    await this.providers.updateLifecycleStatus(input.providerId, "SUSPENDED", { reason: input.reason });

    await this.auditLog.write({
      actorId: input.actorId,
      action: "provider.suspend",
      entityType: "ProviderProfile",
      entityId: input.providerId,
      metadata: { reason: input.reason },
    });

    await this.events.publish({
      type: "ProviderSuspended",
      payload: { reason: input.reason },
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: input.providerId,
    });
  }
}
