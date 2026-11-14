import type { OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "./errors";

export interface CancelOnDemandRequestInput {
  requestId: string;
  cancelledByUserId: string;
}

// Cancellable up through EN_ROUTE; once IN_PROGRESS the provider is
// already on-site performing the service, so further recourse goes
// through Disputes rather than a plain cancel.
const CANCELLABLE_STATUSES = ["SEARCHING", "ASSIGNED", "EN_ROUTE"];

export class CancelOnDemandRequestUseCase {
  constructor(
    private readonly requests: OnDemandRequestRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CancelOnDemandRequestInput): Promise<void> {
    const request = await this.requests.findById(input.requestId);
    if (!request) {
      throw new OnDemandRequestNotFoundError();
    }

    if (!CANCELLABLE_STATUSES.includes(request.status)) {
      throw new InvalidOnDemandStatusTransitionError(request.status, "CANCELLED");
    }

    await this.requests.updateStatus(input.requestId, "CANCELLED", { cancelledAt: new Date() });

    await this.events.publish({
      type: "OnDemandRequestCancelled",
      payload: { cancelledByUserId: input.cancelledByUserId, fromStatus: request.status },
      relatedEntityType: "ON_DEMAND_REQUEST",
      relatedEntityId: request.id,
    });
  }
}
