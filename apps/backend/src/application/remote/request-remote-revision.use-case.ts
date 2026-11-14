import type { CreateRemoteRevisionInput, RemoteRevision, RemoteRevisionRepository } from "@/domain/remote/remote-revision.repository";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "./errors";

// Only meaningful once work has been DELIVERED — requesting it sends the
// engagement back to ACTIVE (the provider has more work to do) while the
// revision record itself tracks the specific ask separately from the
// engagement's own status.
export class RequestRemoteRevisionUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly revisions: RemoteRevisionRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CreateRemoteRevisionInput): Promise<RemoteRevision> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }
    if (engagement.status !== "DELIVERED") {
      throw new InvalidRemoteEngagementStatusTransitionError(engagement.status, "REVISION_REQUEST");
    }

    const revision = await this.revisions.create(input);
    await this.engagements.updateStatus(input.engagementId, "ACTIVE");

    await this.events.publish({
      type: "RemoteRevisionRequested",
      payload: { notes: input.notes },
      relatedEntityType: "REMOTE_ENGAGEMENT",
      relatedEntityId: engagement.id,
    });

    return revision;
  }
}
