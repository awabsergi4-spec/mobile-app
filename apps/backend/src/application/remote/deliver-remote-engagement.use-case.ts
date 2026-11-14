import type { RemoteEngagement } from "@/domain/remote/remote-engagement.entity";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "./errors";

export interface DeliverRemoteEngagementInput {
  engagementId: string;
}

// Provider marks the work delivered — ACTIVE → DELIVERED. The customer
// then either completes it or requests a revision (which sends it back to
// ACTIVE), see RequestRemoteRevisionUseCase.
export class DeliverRemoteEngagementUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: DeliverRemoteEngagementInput): Promise<RemoteEngagement> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }
    if (engagement.status !== "ACTIVE") {
      throw new InvalidRemoteEngagementStatusTransitionError(engagement.status, "DELIVERED");
    }

    const updated = await this.engagements.updateStatus(input.engagementId, "DELIVERED");

    await this.events.publish({
      type: "RemoteEngagementDelivered",
      payload: {},
      relatedEntityType: "REMOTE_ENGAGEMENT",
      relatedEntityId: engagement.id,
    });

    return updated;
  }
}
