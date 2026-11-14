import type { MilestoneStatus, RemoteMilestone, RemoteMilestoneRepository } from "@/domain/remote/remote-milestone.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidRemoteMilestoneStatusTransitionError, RemoteMilestoneNotFoundError } from "./errors";

// Identical shape to application/contract/update-contract-milestone-status.use-case.ts —
// same state machine, same actor-authorization split (provider drives
// PENDING→IN_PROGRESS→SUBMITTED, customer drives SUBMITTED→APPROVED,
// system/workflow drives APPROVED→PAID), enforced by the route layer.
const ALLOWED_TRANSITIONS: Record<string, MilestoneStatus[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["APPROVED"],
  APPROVED: ["PAID"],
};

const EVENT_TYPE_BY_STATUS: Record<string, string> = {
  SUBMITTED: "RemoteMilestoneSubmitted",
  APPROVED: "RemoteMilestoneApproved",
  PAID: "RemoteMilestonePaid",
};

export interface UpdateRemoteMilestoneStatusInput {
  milestoneId: string;
  toStatus: MilestoneStatus;
}

export class UpdateRemoteMilestoneStatusUseCase {
  constructor(
    private readonly milestones: RemoteMilestoneRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: UpdateRemoteMilestoneStatusInput): Promise<RemoteMilestone> {
    const milestone = await this.milestones.findById(input.milestoneId);
    if (!milestone) {
      throw new RemoteMilestoneNotFoundError();
    }

    const allowed = ALLOWED_TRANSITIONS[milestone.status] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new InvalidRemoteMilestoneStatusTransitionError(milestone.status, input.toStatus);
    }

    const updated = await this.milestones.updateStatus(input.milestoneId, input.toStatus);

    const eventType = EVENT_TYPE_BY_STATUS[input.toStatus];
    if (eventType) {
      await this.events.publish({
        type: eventType,
        payload: { engagementId: milestone.engagementId, amount: milestone.amount },
        relatedEntityType: "REMOTE_ENGAGEMENT",
        relatedEntityId: milestone.id,
      });
    }

    return updated;
  }
}
