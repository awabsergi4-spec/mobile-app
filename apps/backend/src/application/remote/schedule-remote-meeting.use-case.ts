import type { CreateRemoteMeetingInput, RemoteMeeting, RemoteMeetingRepository } from "@/domain/remote/remote-meeting.repository";
import type { RemoteEngagementRepository } from "@/domain/remote/remote-engagement.repository";
import { RemoteEngagementNotFoundError } from "./errors";

export class ScheduleRemoteMeetingUseCase {
  constructor(
    private readonly engagements: RemoteEngagementRepository,
    private readonly meetings: RemoteMeetingRepository,
  ) {}

  async execute(input: CreateRemoteMeetingInput): Promise<RemoteMeeting> {
    const engagement = await this.engagements.findById(input.engagementId);
    if (!engagement) {
      throw new RemoteEngagementNotFoundError();
    }

    return this.meetings.create(input);
  }
}
