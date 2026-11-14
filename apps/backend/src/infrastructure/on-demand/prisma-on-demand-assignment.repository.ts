import type { PrismaClient } from "@prisma/client";
import type {
  AssignmentStatus,
  CreateOnDemandAssignmentInput,
  ListByProviderFilter,
  OnDemandAssignment,
  OnDemandAssignmentRepository,
} from "@/domain/on-demand/on-demand-assignment.repository";

export class PrismaOnDemandAssignmentRepository implements OnDemandAssignmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateOnDemandAssignmentInput): Promise<OnDemandAssignment> {
    return this.prisma.onDemandAssignment.create({
      data: { requestId: input.requestId, providerId: input.providerId, quotedPrice: input.quotedPrice },
    }) as unknown as Promise<OnDemandAssignment>;
  }

  async findById(id: string): Promise<OnDemandAssignment | null> {
    return this.prisma.onDemandAssignment.findUnique({ where: { id } }) as unknown as Promise<OnDemandAssignment | null>;
  }

  async listByRequestId(requestId: string): Promise<OnDemandAssignment[]> {
    return this.prisma.onDemandAssignment.findMany({
      where: { requestId },
      orderBy: { offeredAt: "asc" },
    }) as unknown as Promise<OnDemandAssignment[]>;
  }

  async listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<OnDemandAssignment[]> {
    return this.prisma.onDemandAssignment.findMany({
      where: { providerId, status: filter.status },
      orderBy: { offeredAt: "desc" },
      take: filter.limit ?? 25,
    }) as unknown as Promise<OnDemandAssignment[]>;
  }

  async updateStatus(id: string, status: AssignmentStatus, details?: { respondedAt?: Date }): Promise<OnDemandAssignment> {
    return this.prisma.onDemandAssignment.update({
      where: { id },
      data: { status, respondedAt: details?.respondedAt },
    }) as unknown as Promise<OnDemandAssignment>;
  }

  async expirePendingOffers(requestId: string, exceptAssignmentId: string): Promise<void> {
    await this.prisma.onDemandAssignment.updateMany({
      where: { requestId, status: "OFFERED", id: { not: exceptAssignmentId } },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus,
    details?: { respondedAt?: Date },
  ): Promise<boolean> {
    const result = await this.prisma.onDemandAssignment.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, respondedAt: details?.respondedAt },
    });
    return result.count === 1;
  }
}
