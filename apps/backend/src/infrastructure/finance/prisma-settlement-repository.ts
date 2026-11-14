import type { PrismaClient, SettlementStatus } from "@prisma/client";
import type { CreateSettlementInput, SettlementRecord, SettlementRepository } from "@/domain/finance/settlement-repository";

export class PrismaSettlementRepository implements SettlementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateSettlementInput): Promise<SettlementRecord> {
    return this.prisma.settlement.create({
      data: {
        schedule: input.schedule,
        totalAmount: input.totalAmount,
        currency: input.currency,
        scheduledFor: input.scheduledFor,
      },
    });
  }

  async findById(id: string): Promise<SettlementRecord | null> {
    return this.prisma.settlement.findUnique({ where: { id } });
  }

  async listByStatus(status: SettlementStatus, filter?: { limit?: number }): Promise<SettlementRecord[]> {
    return this.prisma.settlement.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: filter?.limit ?? 50,
    });
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: SettlementStatus,
    toStatus: SettlementStatus,
    details?: { processedAt?: Date },
  ): Promise<boolean> {
    const result = await this.prisma.settlement.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus, processedAt: details?.processedAt },
    });
    return result.count === 1;
  }
}
