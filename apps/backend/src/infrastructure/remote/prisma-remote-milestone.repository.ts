import type { PrismaClient } from "@prisma/client";
import type {
  CreateRemoteMilestoneInput,
  MilestoneStatus,
  RemoteMilestone,
  RemoteMilestoneRepository,
} from "@/domain/remote/remote-milestone.repository";

export class PrismaRemoteMilestoneRepository implements RemoteMilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRemoteMilestoneInput): Promise<RemoteMilestone> {
    return this.prisma.remoteMilestone.create({
      data: { engagementId: input.engagementId, title: input.title, amount: input.amount, dueDate: input.dueDate },
    }) as unknown as Promise<RemoteMilestone>;
  }

  async findById(id: string): Promise<RemoteMilestone | null> {
    return this.prisma.remoteMilestone.findUnique({ where: { id } }) as unknown as Promise<RemoteMilestone | null>;
  }

  async listByEngagementId(engagementId: string): Promise<RemoteMilestone[]> {
    return this.prisma.remoteMilestone.findMany({ where: { engagementId } }) as unknown as Promise<RemoteMilestone[]>;
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<RemoteMilestone> {
    return this.prisma.remoteMilestone.update({ where: { id }, data: { status } }) as unknown as Promise<RemoteMilestone>;
  }
}
