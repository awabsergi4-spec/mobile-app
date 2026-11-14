import type { RemoteRevision, RemoteRevisionRepository, RevisionStatus } from "@/domain/remote/remote-revision.repository";
import { InvalidRemoteRevisionStatusTransitionError, RemoteRevisionNotFoundError } from "./errors";

// Provider-driven: REQUESTED → IN_PROGRESS (starts addressing it) →
// RESOLVED (done — the provider then re-delivers via
// DeliverRemoteEngagementUseCase to move the engagement back to
// DELIVERED for the customer to review again).
const ALLOWED_TRANSITIONS: Record<string, RevisionStatus[]> = {
  REQUESTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
};

export interface UpdateRemoteRevisionStatusInput {
  revisionId: string;
  toStatus: RevisionStatus;
}

export class UpdateRemoteRevisionStatusUseCase {
  constructor(private readonly revisions: RemoteRevisionRepository) {}

  async execute(input: UpdateRemoteRevisionStatusInput): Promise<RemoteRevision> {
    const revision = await this.revisions.findById(input.revisionId);
    if (!revision) {
      throw new RemoteRevisionNotFoundError();
    }

    const allowed = ALLOWED_TRANSITIONS[revision.status] ?? [];
    if (!allowed.includes(input.toStatus)) {
      throw new InvalidRemoteRevisionStatusTransitionError(revision.status, input.toStatus);
    }

    return this.revisions.updateStatus(input.revisionId, input.toStatus);
  }
}
