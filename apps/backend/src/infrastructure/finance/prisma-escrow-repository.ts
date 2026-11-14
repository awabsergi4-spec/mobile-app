import { Prisma } from "@prisma/client";
import type { EscrowStatus, PrismaClient } from "@prisma/client";
import type { CreateEscrowInput, EscrowRecord, EscrowRepository } from "@/domain/finance/escrow-repository";
import { EscrowAlreadyFundedError } from "@/domain/finance/escrow-repository";

export class PrismaEscrowRepository implements EscrowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateEscrowInput): Promise<EscrowRecord> {
    try {
      return (await this.prisma.escrow.create({
        data: {
          relatedEntityType: input.relatedEntityType as never,
          relatedEntityId: input.relatedEntityId,
          amount: input.amount,
          currency: input.currency,
          expiresAt: input.expiresAt,
        },
      })) as unknown as EscrowRecord;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new EscrowAlreadyFundedError();
      }
      throw err;
    }
  }

  async findById(escrowId: string): Promise<EscrowRecord | null> {
    return this.prisma.escrow.findUnique({ where: { id: escrowId } }) as unknown as Promise<EscrowRecord | null>;
  }

  async findByRelatedEntity(relatedEntityType: string, relatedEntityId: string): Promise<EscrowRecord | null> {
    return this.prisma.escrow.findUnique({
      where: { relatedEntityType_relatedEntityId: { relatedEntityType: relatedEntityType as never, relatedEntityId } },
    }) as unknown as Promise<EscrowRecord | null>;
  }

  async updateStatus(
    escrowId: string,
    status: EscrowStatus,
    timestamps?: { releasedAt?: Date; refundedAt?: Date; disputedAt?: Date },
  ): Promise<void> {
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: { status, ...timestamps },
    });
  }

  async applyRelease(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; releasedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean> {
    const result = await this.prisma.escrow.updateMany({
      where: { id: escrowId, status: expected.status, releasedAmount: expected.releasedAmount },
      data: {
        releasedAmount: { increment: amount },
        status: newStatus,
        releasedAt: newStatus === "RELEASED" ? new Date() : undefined,
      },
    });
    return result.count === 1;
  }

  async applyRefund(
    escrowId: string,
    amount: number,
    expected: { status: EscrowStatus; refundedAmount: number },
    newStatus: EscrowStatus,
  ): Promise<boolean> {
    const result = await this.prisma.escrow.updateMany({
      where: { id: escrowId, status: expected.status, refundedAmount: expected.refundedAmount },
      data: {
        refundedAmount: { increment: amount },
        status: newStatus,
        refundedAt: newStatus === "REFUNDED" ? new Date() : undefined,
      },
    });
    return result.count === 1;
  }
}
