import type { OnDemandAssignmentRepository } from "@/domain/on-demand/on-demand-assignment.repository";
import type { OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  NotOfferedProviderError,
  OnDemandAssignmentNotFoundError,
  OnDemandAssignmentNotOfferedError,
} from "./errors";

export interface AcceptOnDemandAssignmentInput {
  assignmentId: string;
  providerId: string;
}

// The OFFERED -> ACCEPTED transition is claimed via an atomic conditional
// update (compareAndSetStatus), not read-then-write — a provider
// double-tapping accept, or an accept racing a concurrent decline on the
// same assignment, must not both be able to observe OFFERED and proceed.
// Audit finding.
export class AcceptOnDemandAssignmentUseCase {
  constructor(
    private readonly assignments: OnDemandAssignmentRepository,
    private readonly requests: OnDemandRequestRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: AcceptOnDemandAssignmentInput): Promise<void> {
    const assignment = await this.assignments.findById(input.assignmentId);
    if (!assignment) {
      throw new OnDemandAssignmentNotFoundError();
    }
    if (assignment.providerId !== input.providerId) {
      throw new NotOfferedProviderError();
    }

    const claimed = await this.assignments.compareAndSetStatus(assignment.id, "OFFERED", "ACCEPTED", {
      respondedAt: new Date(),
    });
    if (!claimed) {
      throw new OnDemandAssignmentNotOfferedError();
    }

    await this.assignments.expirePendingOffers(assignment.requestId, assignment.id);
    await this.requests.updateStatus(assignment.requestId, "ASSIGNED");

    await this.events.publish({
      type: "OnDemandAssignmentAccepted",
      payload: { providerId: assignment.providerId },
      relatedEntityType: "ON_DEMAND_REQUEST",
      relatedEntityId: assignment.requestId,
    });
  }
}
