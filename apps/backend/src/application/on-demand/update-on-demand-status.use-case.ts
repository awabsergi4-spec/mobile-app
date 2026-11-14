import type { OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { OnDemandRequest, OnDemandStatus } from "@/domain/on-demand/on-demand-request.entity";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidOnDemandStatusTransitionError, OnDemandRequestNotFoundError } from "./errors";

// The linear ASSIGNED → EN_ROUTE → IN_PROGRESS → COMPLETED path a
// provider drives once dispatched. One use case for all three transitions
// (rather than three near-identical classes) because the only thing that
// varies is which edge of the same small state machine is being walked —
// unlike Suspend/Reactivate/Delete on Provider, which each carry distinct
// audit/authorization shapes.
const ALLOWED_TRANSITIONS: Record<string, OnDemandStatus[]> = {
  ASSIGNED: ["EN_ROUTE"],
  EN_ROUTE: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

export interface UpdateOnDemandStatusInput {
  requestId: string;
  toStatus: "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED";
}

export class UpdateOnDemandStatusUseCase {
  constructor(
    private readonly requests: OnDemandRequestRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: UpdateOnDemandStatusInput): Promise<OnDemandRequest> {
    const request = await this.requests.findById(input.requestId);
    if (!request) {
      throw new OnDemandRequestNotFoundError();
    }

    const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new InvalidOnDemandStatusTransitionError(request.status, input.toStatus);
    }

    const details = input.toStatus === "COMPLETED" ? { completedAt: new Date() } : undefined;
    const updated = await this.requests.updateStatus(input.requestId, input.toStatus, details);

    await this.events.publish({
      type: input.toStatus === "COMPLETED" ? "OnDemandRequestCompleted" : "OnDemandRequestStatusChanged",
      payload: { status: input.toStatus },
      relatedEntityType: "ON_DEMAND_REQUEST",
      relatedEntityId: request.id,
    });

    return updated;
  }
}
