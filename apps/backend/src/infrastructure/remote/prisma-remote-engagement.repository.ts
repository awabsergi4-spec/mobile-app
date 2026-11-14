import type { PrismaClient } from "@prisma/client";
import type { RemoteEngagement, RemoteEngagementStatus } from "@/domain/remote/remote-engagement.entity";
import type {
  CreateRemoteEngagementInput,
  ListByPartyFilter,
  RemoteEngagementRepository,
  SearchRemoteEngagementsFilter,
} from "@/domain/remote/remote-engagement.repository";

export class PrismaRemoteEngagementRepository implements RemoteEngagementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRemoteEngagementInput): Promise<RemoteEngagement> {
    return this.prisma.remoteEngagement.create({
      data: {
        customerId: input.customerId,
        companyId: input.companyId,
        providerId: input.providerId,
        categoryId: input.categoryId,
        title: input.title,
        priceType: input.priceType,
        amount: input.amount,
      },
    }) as unknown as Promise<RemoteEngagement>;
  }

  async findById(id: string): Promise<RemoteEngagement | null> {
    return this.prisma.remoteEngagement.findUnique({ where: { id } }) as unknown as Promise<RemoteEngagement | null>;
  }

  async updateStatus(
    id: string,
    status: RemoteEngagementStatus,
    details?: { completedAt?: Date },
  ): Promise<RemoteEngagement> {
    return this.prisma.remoteEngagement.update({
      where: { id },
      data: { status, completedAt: details?.completedAt },
    }) as unknown as Promise<RemoteEngagement>;
  }

  async search(filter: SearchRemoteEngagementsFilter): Promise<RemoteEngagement[]> {
    return this.prisma.remoteEngagement.findMany({
      where: { status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<RemoteEngagement[]>;
  }

  async listByCustomerId(customerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]> {
    return this.prisma.remoteEngagement.findMany({
      where: { customerId, status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
    }) as unknown as Promise<RemoteEngagement[]>;
  }

  async listByProviderId(providerId: string, filter: ListByPartyFilter): Promise<RemoteEngagement[]> {
    return this.prisma.remoteEngagement.findMany({
      where: { providerId, status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
    }) as unknown as Promise<RemoteEngagement[]>;
  }
}
