import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "./errors";

export interface CancelRemoteEngagementInput {
  engagementId: string;
  cancelledByUserId: string;
}

const CANCELLABLE_STATUSES = ["ACTIVE", "DELIVERED"];

export class CancelRemoteEngagementUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CancelRemoteEngagementInput): Promise<void> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }
    if (!CANCELLABLE_STATUSES.includes(engagement.status)) {
      throw new InvalidRemoteEngagementStatusTransitionError(engagement.status, "CANCELLED");
    }

    await this.engagements.updateStatus(input.engagementId, "CANCELLED");

    await this.events.publish({
      type: "RemoteEngagementCancelled",
      payload: { cancelledByUserId: input.cancelledByUserId },
      relatedEntityType: "REMOTE_ENGAGEMENT",
      relatedEntityId: engagement.id,
    });
  }
}
