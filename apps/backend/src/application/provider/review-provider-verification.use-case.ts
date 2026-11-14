import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { VerificationStatus } from "@/domain/provider/provider-profile.entity";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { ProviderProfileNotFoundError } from "./errors";

export interface ReviewProviderVerificationInput {
  providerId: string;
  decision: "VERIFIED" | "REJECTED" | "NEEDS_MORE_INFO";
  reason?: string;
  actorId: string;
}

// The admin-side counterpart to SubmitProviderVerificationUseCase: closes
// the loop opened by ProviderVerificationSubmitted. Same shape again —
// entity state transition owned here, DomainEvent published as the
// additive side effect for the Workflow Engine (ADR-009) to react to
// (e.g. notify the provider).
export class ReviewProviderVerificationUseCase {
  constructor(
    private readonly providers: ProviderProfileRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReviewProviderVerificationInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }

    const status: VerificationStatus = input.decision;
    await this.providers.updateVerificationStatus(input.providerId, status);

    await this.auditLog.write({
      actorId: input.actorId,
      action: "provider.verification.review",
      entityType: "ProviderProfile",
      entityId: input.providerId,
      metadata: { decision: input.decision, reason: input.reason },
    });

    await this.events.publish({
      type: "ProviderVerificationReviewed",
      payload: { decision: input.decision, reason: input.reason },
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: input.providerId,
    });
  }
}
