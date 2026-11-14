import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { EscrowNotHeldError, EscrowReleaseConflictError, InvalidEscrowRefundAmountError } from "./errors";

export interface RefundEscrowInput {
  escrowId: string;
  gatewayProvider: string;
  reason: string;
  refundAmount?: number; // defaults to the escrow's full remaining amount
  idempotencyKey: string;
}

// The internal ledger mechanic for "money leaves escrow back toward the
// customer" — Debit ESCROW_HOLDING / Credit CASH_AT_PAYMENT_PROVIDER,
// the exact mirror of FundEscrowUseCase. Deliberately does not call the
// PaymentProvider gateway itself: RefundPaymentUseCase (Phase 6) is the
// customer-facing orchestrator that decides whether funds are still in
// escrow (calls this) or already released to a provider (a different,
// compensating-entry flow), and is the one that actually calls
// provider.refund() to move money back to the customer's card.
//
// Same claim-before-act ordering as ReleaseEscrowUseCase, for the same
// reason: two concurrent refunds against one escrow must not both post
// money movements before either result is known.
export class RefundEscrowUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: RefundEscrowInput): Promise<{ refundAmount: number }> {
    const existing = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return { refundAmount: existing.amount };
    }

    const escrow = await this.escrows.findById(input.escrowId);
    if (!escrow || (escrow.status !== "HELD" && escrow.status !== "PARTIALLY_RELEASED")) {
      throw new EscrowNotHeldError(input.escrowId);
    }

    const remaining = escrow.amount - escrow.releasedAmount - escrow.refundedAmount;
    const refundAmount = input.refundAmount ?? remaining;
    if (refundAmount <= 0 || refundAmount > remaining) {
      throw new InvalidEscrowRefundAmountError();
    }

    const isFullyRefunded = escrow.refundedAmount + refundAmount + escrow.releasedAmount >= escrow.amount;
    const newStatus = isFullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const claimed = await this.escrows.applyRefund(
      escrow.id,
      refundAmount,
      { status: escrow.status, refundedAmount: escrow.refundedAmount },
      newStatus,
    );
    if (!claimed) {
      throw new EscrowReleaseConflictError();
    }

    const entry = await this.ledger.postJournalEntry({
      description: `Escrow refund for ${escrow.relatedEntityType} ${escrow.relatedEntityId}: ${input.reason}`,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      lines: [
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "DEBIT", amount: refundAmount, currency: escrow.currency },
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "CREDIT", amount: refundAmount, currency: escrow.currency },
      ],
    });

    await this.transactions.record({
      type: "REFUND",
      amount: refundAmount,
      currency: escrow.currency,
      gatewayProvider: input.gatewayProvider,
      journalEntryId: entry.journalEntryId,
      reason: input.reason,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      idempotencyKey: input.idempotencyKey,
    });

    await this.events.publish({
      type: isFullyRefunded ? "EscrowRefunded" : "EscrowPartiallyRefunded",
      payload: { refundAmount, currency: escrow.currency, reason: input.reason },
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
    });

    return { refundAmount };
  }
}
