import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import type { ProviderDocumentRepository } from "@/domain/provider/provider-document.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  ProviderProfileNotFoundError,
  ProviderVerificationAlreadyPendingError,
  ProviderVerificationDocumentsRequiredError,
} from "./errors";

export interface SubmitProviderVerificationInput {
  providerId: string;
}

// Requires at least one uploaded ProviderDocument, then transitions
// verificationStatus to PENDING_REVIEW and publishes
// ProviderVerificationSubmitted (ADR-009) — the event a future
// WorkflowDefinition/AutomationRule would react to (e.g. notify an admin
// queue). The state transition itself stays owned by this use case, exactly
// mirroring ReleaseEscrowUseCase's EscrowReleased pattern: entity state
// machines aren't replaced by the Workflow Engine, they publish into it.
export class SubmitProviderVerificationUseCase {
  constructor(
    private readonly providers: ProviderProfileRepository,
    private readonly documents: ProviderDocumentRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: SubmitProviderVerificationInput): Promise<void> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) {
      throw new ProviderProfileNotFoundError();
    }

    if (provider.verificationStatus === "PENDING_REVIEW") {
      throw new ProviderVerificationAlreadyPendingError();
    }

    const documentCount = await this.documents.countByProviderId(input.providerId);
    if (documentCount < 1) {
      throw new ProviderVerificationDocumentsRequiredError();
    }

    await this.providers.updateVerificationStatus(input.providerId, "PENDING_REVIEW");

    await this.events.publish({
      type: "ProviderVerificationSubmitted",
      payload: {},
      relatedEntityType: "PROVIDER_PROFILE",
      relatedEntityId: input.providerId,
    });
  }
}
