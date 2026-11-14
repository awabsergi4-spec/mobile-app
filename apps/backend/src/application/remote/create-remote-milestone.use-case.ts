import type {
  CreateRemoteMilestoneInput,
  RemoteMilestone,
  RemoteMilestoneRepository,
} from "@/domain/remote/remote-milestone.repository";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import { InvalidRemoteEngagementStatusTransitionError, RemoteEngagementNotFoundError } from "./errors";

export class CreateRemoteMilestoneUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly milestones: RemoteMilestoneRepository,
  ) {}

  async execute(input: CreateRemoteMilestoneInput): Promise<RemoteMilestone> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }
    if (engagement.status !== "ACTIVE") {
      throw new InvalidRemoteEngagementStatusTransitionError(engagement.status, "MILESTONE_CREATION");
    }

    return this.milestones.create(input);
  }
}
