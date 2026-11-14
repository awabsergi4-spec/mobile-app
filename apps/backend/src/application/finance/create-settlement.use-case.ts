import type { SettlementRecord, SettlementRepository } from "@/domain/finance/settlement-repository";
import type { WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { SettlementSchedule } from "@prisma/client";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";

export interface CreateSettlementInput {
  schedule: SettlementSchedule;
  currency: string;
  scheduledFor?: Date;
}

// Batches every currently-APPROVED withdrawal in one currency into a
// single Settlement — "Settlement is a batch entity over Withdrawal
// records, not a fake transaction type" (ADR-008). Each withdrawal moves
// APPROVED -> PROCESSING and is stamped with this settlement's id; the
// actual payout happens per-withdrawal via MarkWithdrawalPaidUseCase
// (called once whatever downstream batch-payout process — a bank file, a
// mobile-money bulk API — confirms each one), then
// CompleteSettlementUseCase closes the batch out.
export class CreateSettlementUseCase {
  constructor(
    private readonly settlements: SettlementRepository,
    private readonly withdrawals: WithdrawalRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CreateSettlementInput): Promise<SettlementRecord | null> {
    const approved = (await this.withdrawals.listByStatus("APPROVED", { limit: 500 })).filter(
      (w) => w.currency === input.currency,
    );
    if (approved.length === 0) {
      return null;
    }

    const totalAmount = approved.reduce((sum, w) => sum + w.amount + w.feeMinorUnits, 0);

    const settlement = await this.settlements.create({
      schedule: input.schedule,
      totalAmount,
      currency: input.currency,
      scheduledFor: input.scheduledFor,
    });

    for (const withdrawal of approved) {
      const claimed = await this.withdrawals.compareAndSetStatus(withdrawal.id, "APPROVED", "PROCESSING", {
        settlementId: settlement.id,
      });
      if (!claimed) {
        // Lost a race with something else moving this withdrawal — skip
        // it rather than fail the whole batch; it stays eligible for the
        // next settlement run.
        continue;
      }
    }

    await this.events.publish({
      type: "SettlementCreated",
      payload: { totalAmount, currency: input.currency, withdrawalCount: approved.length },
      relatedEntityType: "SETTLEMENT",
      relatedEntityId: settlement.id,
    });

    return settlement;
  }
}
