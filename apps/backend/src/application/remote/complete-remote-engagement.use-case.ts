import type { RemoteEngagement } from "@/domain/remote/remote-engagement.entity";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { RemoteMilestoneRepository } from "@/domain/remote/remote-milestone.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  InvalidRemoteEngagementStatusTransitionError,
  RemoteEngagementHasUnpaidMilestonesError,
  RemoteEngagementNotFoundError,
} from "./errors";

export interface CompleteRemoteEngagementInput {
  engagementId: string;
}

// Mirrors CompleteContractUseCase exactly: only from DELIVERED, and only
// once every milestone (if any were defined) is PAID.
export class CompleteRemoteEngagementUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly milestones: RemoteMilestoneRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CompleteRemoteEngagementInput): Promise<RemoteEngagement> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }
    if (engagement.status !== "DELIVERED") {
      throw new InvalidRemoteEngagementStatusTransitionError(engagement.status, "COMPLETED");
    }

    const engagementMilestones = await this.milestones.listByEngagementId(input.engagementId);
    const hasUnpaidMilestone = engagementMilestones.some((milestone) => milestone.status !== "PAID");
    if (engagementMilestones.length > 0 && hasUnpaidMilestone) {
      throw new RemoteEngagementHasUnpaidMilestonesError();
    }

    const updated = await this.engagements.updateStatus(input.engagementId, "COMPLETED", { completedAt: new Date() });

    await this.events.publish({
      type: "RemoteEngagementCompleted",
      payload: {},
      relatedEntityType: "REMOTE_ENGAGEMENT",
      relatedEntityId: engagement.id,
    });

    return updated;
  }
}
