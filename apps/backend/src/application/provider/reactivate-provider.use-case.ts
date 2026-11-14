import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidProviderLifecycleTransitionError, ProviderProfileNotFoundError } from "./errors";

export interface ReactivateProviderInput {
  providerId: string;
  actorId: string;
}

export class ReactivateProviderUseCase {
  constructor(
    private readonly providers: ProviderProfileRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReactivateProviderInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }
    if (provider.status === "DELETED") {
      throw new InvalidProviderLifecycleTransitionError("DELETED", "ACTIVE");
    }

    await this.providers.updateLifecycleStatus(input.providerId, "ACTIVE");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "provider.reactivate",
      entityType: "ProviderProfile",
      entityId: input.providerId,
    });

    await this.events.publish({
      type: "ProviderReactivated",
      payload: {},
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: input.providerId,
    });
  }
}
