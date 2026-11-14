import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { EscrowNotHeldError, EscrowReleaseConflictError } from "./errors";

export interface CancelEscrowInput {
  escrowId: string;
  gatewayProvider: string;
  reason: string;
  idempotencyKey: string;
}

// Cancel is narrower than Refund: only a pristine HELD escrow (nothing
// released or refunded yet) can be cancelled — "this never happened,"
// full amount back. Once any partial release/refund has occurred, the
// remainder goes through RefundEscrowUseCase instead, which is built to
// handle a non-zero starting releasedAmount/refundedAmount correctly.
export class CancelEscrowUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CancelEscrowInput): Promise<{ refundAmount: number }> {
    const existing = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return { refundAmount: existing.amount };
    }

    const escrow = await this.escrows.findById(input.escrowId);
    if (!escrow || escrow.status !== "HELD") {
      throw new EscrowNotHeldError(input.escrowId);
    }

    const claimed = await this.escrows.applyRefund(
      escrow.id,
      escrow.amount,
      { status: "HELD", refundedAmount: 0 },
      "CANCELLED",
    );
    if (!claimed) {
      throw new EscrowReleaseConflictError();
    }

    const entry = await this.ledger.postJournalEntry({
      description: `Escrow cancelled for ${escrow.relatedEntityType} ${escrow.relatedEntityId}: ${input.reason}`,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      lines: [
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "DEBIT", amount: escrow.amount, currency: escrow.currency },
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "CREDIT", amount: escrow.amount, currency: escrow.currency },
      ],
    });

    await this.transactions.record({
      type: "REFUND",
      amount: escrow.amount,
      currency: escrow.currency,
      gatewayProvider: input.gatewayProvider,
      journalEntryId: entry.journalEntryId,
      reason: input.reason,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      idempotencyKey: input.idempotencyKey,
    });

    await this.events.publish({
      type: "EscrowCancelled",
      payload: { refundAmount: escrow.amount, currency: escrow.currency, reason: input.reason },
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
    });

    return { refundAmount: escrow.amount };
  }
}
