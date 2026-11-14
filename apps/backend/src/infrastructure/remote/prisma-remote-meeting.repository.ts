import type { PrismaClient } from "@prisma/client";
import type { CreateRemoteMeetingInput, RemoteMeeting, RemoteMeetingRepository } from "@/domain/remote/remote-meeting.repository";

export class PrismaRemoteMeetingRepository implements RemoteMeetingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRemoteMeetingInput): Promise<RemoteMeeting> {
    return this.prisma.remoteMeeting.create({
      data: { engagementId: input.engagementId, scheduledAt: input.scheduledAt, joinUrl: input.joinUrl },
    });
  }

  async listByEngagementId(engagementId: string): Promise<RemoteMeeting[]> {
    return this.prisma.remoteMeeting.findMany({ where: { engagementId }, orderBy: { scheduledAt: "asc" } });
  }
}
