import type { CreateOnDemandRequestInput, OnDemandRequestRepository } from "@/domain/on-demand/on-demand-request.repository";
import type { OnDemandAssignmentRepository } from "@/domain/on-demand/on-demand-assignment.repository";
import type { OnDemandRequest } from "@/domain/on-demand/on-demand-request.entity";
import type { ProviderMatcher } from "@/domain/on-demand/provider-matcher";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";

// Creates the request and, for INSTANT fulfillment, immediately offers it
// to the single best-matched provider (sequential dispatch) rather than
// broadcasting to every candidate at once — simpler and defensible for v1,
// and re-offering on decline (DeclineOnDemandAssignmentUseCase) reaches the
// same candidates without a redesign. SCHEDULED requests skip matching
// here entirely; dispatch for those happens closer to scheduledFor, out of
// this use case's scope (see ADR-003).
export class CreateOnDemandRequestUseCase {
  constructor(
    private readonly requests: OnDemandRequestRepository,
    private readonly assignments: OnDemandAssignmentRepository,
    private readonly matcher: ProviderMatcher,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CreateOnDemandRequestInput): Promise<OnDemandRequest> {
    const request = await this.requests.create(input);

    await this.events.publish({
      type: "OnDemandRequestCreated",
      payload: { categoryId: request.categoryId, isEmergency: request.isEmergency },
      relatedEntityType: "ON_DEMAND_REQUEST",
      relatedEntityId: request.id,
    });

    if (request.fulfillmentMode !== "INSTANT") {
      return request;
    }

    const [topCandidate] = await this.matcher.findCandidates({
      requestId: request.id,
      categoryId: request.categoryId,
      lat: request.lat,
      lng: request.lng,
      limit: 1,
    });

    if (topCandidate) {
      await this.assignments.create({ requestId: request.id, providerId: topCandidate.providerId });
      await this.events.publish({
        type: "OnDemandProviderOffered",
        payload: { providerId: topCandidate.providerId, score: topCandidate.score },
        relatedEntityType: "ON_DEMAND_REQUEST",
        relatedEntityId: request.id,
      });
    }

    return request;
  }
}
