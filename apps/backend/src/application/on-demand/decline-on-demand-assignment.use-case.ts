import type { OnDemandAssignmentRepository } from "@/domain/on-demand/on-demand-assignment.repository";
import type { OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { ProviderMatcher } from "@/domain/on-demand/provider-matcher";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  NotOfferedProviderError,
  OnDemandAssignmentNotFoundError,
  OnDemandAssignmentNotOfferedError,
  OnDemandRequestNotFoundError,
} from "./errors";

export interface DeclineOnDemandAssignmentInput {
  assignmentId: string;
  providerId: string;
}

// Declining re-runs matching excluding every provider already offered (or
// declined) for this request and offers the next-best candidate — the
// same sequential-dispatch mechanics as CreateOnDemandRequestUseCase's
// initial offer, just re-entered. If no candidate remains, the request
// stays SEARCHING with no active offer for ops/retry to pick up.
//
// The OFFERED -> DECLINED transition is claimed atomically (same reasoning
// as AcceptOnDemandAssignmentUseCase) — otherwise a decline racing an
// accept, or a doubled decline call, could both pass the OFFERED check and
// each spawn their own re-offer to the next candidate.
export class DeclineOnDemandAssignmentUseCase {
  constructor(
    private readonly assignments: OnDemandAssignmentRepository,
    private readonly requests: OnDemandRequestRepository,
    private readonly matcher: ProviderMatcher,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: DeclineOnDemandAssignmentInput): Promise<void> {
    const assignment = await this.assignments.findById(input.assignmentId);
    if (!assignment) {
      throw new OnDemandAssignmentNotFoundError();
    }
    if (assignment.providerId !== input.providerId) {
      throw new NotOfferedProviderError();
    }

    const claimed = await this.assignments.compareAndSetStatus(assignment.id, "OFFERED", "DECLINED", {
      respondedAt: new Date(),
    });
    if (!claimed) {
      throw new OnDemandAssignmentNotOfferedError();
    }

    const request = await this.requests.findById(assignment.requestId);
    if (!request) {
      throw new OnDemandRequestNotFoundError();
    }

    await this.events.publish({
      type: "OnDemandAssignmentDeclined",
      payload: { providerId: assignment.providerId },
      relatedEntityType: "ON_DEMAND_REQUEST",
      relatedEntityId: request.id,
    });

    const previousOffers = await this.assignments.listByRequestId(request.id);
    const excludeProviderIds = previousOffers.map((offer) => offer.providerId);

    const [nextCandidate] = await this.matcher.findCandidates({
      requestId: request.id,
      categoryId: request.categoryId,
      lat: request.lat,
      lng: request.lng,
      excludeProviderIds,
      limit: 1,
    });

    if (nextCandidate) {
      await this.assignments.create({ requestId: request.id, providerId: nextCandidate.providerId });
      await this.events.publish({
        type: "OnDemandProviderOffered",
        payload: { providerId: nextCandidate.providerId, score: nextCandidate.score },
        relatedEntityType: "ON_DEMAND_REQUEST",
        relatedEntityId: request.id,
      });
    }
  }
}
