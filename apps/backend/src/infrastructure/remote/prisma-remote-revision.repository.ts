import type { PrismaClient } from "@prisma/client";
import type {
  CreateRemoteRevisionInput,
  RemoteRevision,
  RemoteRevisionRepository,
  RevisionStatus,
} from "@/domain/remote/remote-revision.repository";

export class PrismaRemoteRevisionRepository implements RemoteRevisionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRemoteRevisionInput): Promise<RemoteRevision> {
    return this.prisma.remoteRevision.create({
      data: { engagementId: input.engagementId, requestedBy: input.requestedBy, notes: input.notes },
    });
  }

  async findById(id: string): Promise<RemoteRevision | null> {
    return this.prisma.remoteRevision.findUnique({ where: { id } });
  }

  async listByEngagementId(engagementId: string): Promise<RemoteRevision[]> {
    return this.prisma.remoteRevision.findMany({ where: { engagementId }, orderBy: { createdAt: "desc" } });
  }

  async updateStatus(id: string, status: RevisionStatus): Promise<RemoteRevision> {
    return this.prisma.remoteRevision.update({ where: { id }, data: { status } });
  }
}
