import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidProviderLifecycleTransitionError, ProviderProfileNotFoundError } from "./errors";

export interface DeleteProviderInput {
  providerId: string;
  actorId: string;
}

// Soft delete only (DELETED lifecycle status, deletedAt timestamp) — matches
// the AccountLifecycleStatus enum shared with Company. No hard delete: the
// row and its history (ratings, completed jobs, ledger references) must
// survive for financial/audit integrity per ADR-008.
export class DeleteProviderUseCase {
  constructor(
    private readonly providers: ProviderProfileRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: DeleteProviderInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }
    if (provider.status === "DELETED") {
      throw new InvalidProviderLifecycleTransitionError("DELETED", "DELETED");
    }

    await this.providers.updateLifecycleStatus(input.providerId, "DELETED");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "provider.delete",
      entityType: "ProviderProfile",
      entityId: input.providerId,
    });

    await this.events.publish({
      type: "ProviderDeleted",
      payload: {},
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: input.providerId,
    });
  }
}
