import type { PrismaClient, WalletBucket } from "@prisma/client";
import type {
  WalletBalanceRecord,
  WalletRecord,
  WalletRepository,
  WalletTransactionRecord,
} from "@/domain/finance/wallet-repository";

export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getBalance(walletId: string, bucket: WalletBucket): Promise<number> {
    const row = await this.prisma.walletBalance.findUnique({
      where: { walletId_bucket: { walletId, bucket } },
    });
    return row?.amount ?? 0;
  }

  async adjustBalance(walletId: string, bucket: WalletBucket, deltaMinorUnits: number): Promise<void> {
    await this.prisma.walletBalance.upsert({
      where: { walletId_bucket: { walletId, bucket } },
      create: { walletId, bucket, amount: deltaMinorUnits },
      update: { amount: { increment: deltaMinorUnits } },
    });
  }

  async tryDebitBalance(walletId: string, bucket: WalletBucket, amountMinorUnits: number): Promise<boolean> {
    const result = await this.prisma.walletBalance.updateMany({
      where: { walletId, bucket, amount: { gte: amountMinorUnits } },
      data: { amount: { decrement: amountMinorUnits } },
    });
    return result.count === 1;
  }

  async findById(walletId: string): Promise<WalletRecord | null> {
    return this.prisma.wallet.findUnique({ where: { id: walletId } });
  }

  async findByUserId(userId: string): Promise<WalletRecord | null> {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async findByCompanyId(companyId: string): Promise<WalletRecord | null> {
    return this.prisma.wallet.findUnique({ where: { companyId } });
  }

  async getOrCreateForUser(userId: string, currency: string): Promise<WalletRecord> {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, currency },
      update: {},
    });
  }

  async getOrCreateForCompany(companyId: string, currency: string): Promise<WalletRecord> {
    const existing = await this.prisma.wallet.findUnique({ where: { companyId } });
    if (existing) return existing;
    return this.prisma.wallet.upsert({
      where: { companyId },
      create: { companyId, currency },
      update: {},
    });
  }

  async listBalances(walletId: string): Promise<WalletBalanceRecord[]> {
    const rows = await this.prisma.walletBalance.findMany({ where: { walletId } });
    return rows.map((row) => ({ bucket: row.bucket, amount: row.amount }));
  }

  async listTransactions(walletId: string, filter?: { limit?: number; cursor?: string }): Promise<WalletTransactionRecord[]> {
    const rows = await this.prisma.paymentTransaction.findMany({
      where: { OR: [{ sourceWalletId: walletId }, { destinationWalletId: walletId }] },
      orderBy: { createdAt: "desc" },
      take: filter?.limit ?? 50,
      ...(filter?.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      direction: row.sourceWalletId === walletId ? "OUT" : "IN",
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      createdAt: row.createdAt,
    }));
  }
}
