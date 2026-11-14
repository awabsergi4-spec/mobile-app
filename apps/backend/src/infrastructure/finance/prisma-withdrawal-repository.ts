import type { PrismaClient, WithdrawalStatus } from "@prisma/client";
import type { CreateWithdrawalInput, WithdrawalRecord, WithdrawalRepository } from "@/domain/finance/withdrawal-repository";

export class PrismaWithdrawalRepository implements WithdrawalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateWithdrawalInput): Promise<WithdrawalRecord> {
    return this.prisma.withdrawal.create({
      data: {
        providerId: input.providerId,
        walletId: input.walletId,
        amount: input.amount,
        feeMinorUnits: input.feeMinorUnits ?? 0,
        currency: input.currency,
        method: input.method,
      },
    }) as unknown as Promise<WithdrawalRecord>;
  }

  async findById(id: string): Promise<WithdrawalRecord | null> {
    return this.prisma.withdrawal.findUnique({ where: { id } }) as unknown as Promise<WithdrawalRecord | null>;
  }

  async listByProviderId(providerId: string, filter?: { limit?: number; cursor?: string }): Promise<WithdrawalRecord[]> {
    return this.prisma.withdrawal.findMany({
      where: { providerId },
      orderBy: { requestedAt: "desc" },
      take: filter?.limit ?? 50,
      ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<WithdrawalRecord[]>;
  }

  async listByStatus(status: WithdrawalStatus, filter?: { limit?: number; cursor?: string }): Promise<WithdrawalRecord[]> {
    return this.prisma.withdrawal.findMany({
      where: { status },
      orderBy: { requestedAt: "asc" },
      take: filter?.limit ?? 50,
      ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<WithdrawalRecord[]>;
  }

  async compareAndSetStatus(
    id: string,
    fromStatus: WithdrawalStatus,
    toStatus: WithdrawalStatus,
    details?: { approvedById?: string; rejectedReason?: string; paidAt?: Date; settlementId?: string },
  ): Promise<boolean> {
    const result = await this.prisma.withdrawal.updateMany({
      where: { id, status: fromStatus },
      data: {
        status: toStatus,
        approvedById: details?.approvedById,
        approvedAt: details?.approvedById ? new Date() : undefined,
        rejectedReason: details?.rejectedReason,
        paidAt: details?.paidAt,
        settlementId: details?.settlementId,
      },
    });
    return result.count === 1;
  }
}
