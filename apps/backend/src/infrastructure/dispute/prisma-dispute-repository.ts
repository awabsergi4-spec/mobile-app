import type { DisputeStatus, PrismaClient } from "@prisma/client";
import type { CreateDisputeInput, DisputeRecord, DisputeRepository } from "@/domain/dispute/dispute-repository";

export class PrismaDisputeRepository implements DisputeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateDisputeInput): Promise<DisputeRecord> {
    return this.prisma.dispute.create({
      data: {
        raisedById: input.raisedById,
        relatedEntityType: input.relatedEntityType as never,
        relatedEntityId: input.relatedEntityId,
        reason: input.reason,
      },
    }) as unknown as Promise<DisputeRecord>;
  }

  async findById(id: string): Promise<DisputeRecord | null> {
    return this.prisma.dispute.findUnique({ where: { id } }) as unknown as Promise<DisputeRecord | null>;
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: DisputeStatus,
    toStatus: DisputeStatus,
    resolutionNotes?: string,
  ): Promise<boolean> {
    const result = await this.prisma.dispute.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, resolutionNotes, resolvedAt: toStatus === "RESOLVED" || toStatus === "REJECTED" ? new Date() : undefined },
    });
    return result.count === 1;
  }

  async listByStatus(status: DisputeStatus, filter?: { limit?: number }): Promise<DisputeRecord[]> {
    return this.prisma.dispute.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: filter?.limit ?? 25,
    }) as unknown as Promise<DisputeRecord[]>;
  }

  async listByRaisedById(raisedById: string, filter?: { limit?: number }): Promise<DisputeRecord[]> {
    return this.prisma.dispute.findMany({
      where: { raisedById },
      orderBy: { createdAt: "desc" },
      take: filter?.limit ?? 25,
    }) as unknown as Promise<DisputeRecord[]>;
  }
}
