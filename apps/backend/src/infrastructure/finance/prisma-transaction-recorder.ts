import type { PrismaClient, TransactionStatus, TransactionType } from "@prisma/client";
import type { RecordTransactionInput, TransactionRecord, TransactionRecorder } from "@/domain/finance/transaction-recorder";

export class PrismaTransactionRecorder implements TransactionRecorder {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: RecordTransactionInput): Promise<{ transactionId: string }> {
    if (input.idempotencyKey) {
      const existing = await this.prisma.paymentTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        return { transactionId: existing.id };
      }
    }

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        gatewayProvider: input.gatewayProvider,
        gatewayRef: input.gatewayRef,
        sourceWalletId: input.sourceWalletId,
        destinationWalletId: input.destinationWalletId,
        journalEntryId: input.journalEntryId,
        reason: input.reason,
        relatedEntityType: input.relatedEntityType as never,
        relatedEntityId: input.relatedEntityId,
        idempotencyKey: input.idempotencyKey,
        status: input.status ?? "SUCCEEDED",
      },
    });

    return { transactionId: transaction.id };
  }

  async findById(transactionId: string): Promise<TransactionRecord | null> {
    return this.prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<TransactionRecord | null> {
    return this.prisma.paymentTransaction.findUnique({ where: { idempotencyKey } });
  }

  async updateStatus(transactionId: string, status: TransactionStatus): Promise<void> {
    await this.prisma.paymentTransaction.update({ where: { id: transactionId }, data: { status } });
  }

  async findLatestByGatewayRef(gatewayRef: string): Promise<TransactionRecord | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { gatewayRef },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLatestByRelatedEntity(
    relatedEntityType: string,
    relatedEntityId: string,
    type?: TransactionType,
  ): Promise<TransactionRecord | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { relatedEntityType: relatedEntityType as never, relatedEntityId, type },
      orderBy: { createdAt: "desc" },
    });
  }
}
