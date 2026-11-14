import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { EscrowNotHeldError, EscrowReleaseConflictError } from "./errors";

export interface ExpireEscrowInput {
  escrowId: string;
  gatewayProvider: string;
  idempotencyKey: string;
}

export class EscrowNotExpiredError extends Error {
  constructor() {
    super("This escrow's expiresAt has not passed yet");
  }
}

// System/scheduled-job triggered (a future AutomationRule scanning for
// `expiresAt < now`, ADR-009 — not built here, this is the use case such
// a scan would call). Refunds whatever remains unreleased/unrefunded back
// out, same ledger mechanic as RefundEscrowUseCase, tagged EXPIRED instead
// of REFUNDED so reporting can distinguish "customer/admin requested" from
// "nobody claimed it in time."
export class ExpireEscrowUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ExpireEscrowInput): Promise<{ refundAmount: number }> {
    const existing = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return { refundAmount: existing.amount };
    }

    const escrow = await this.escrows.findById(input.escrowId);
    if (!escrow || (escrow.status !== "HELD" && escrow.status !== "PARTIALLY_RELEASED")) {
      throw new EscrowNotHeldError(input.escrowId);
    }
    if (!escrow.expiresAt || escrow.expiresAt.getTime() > Date.now()) {
      throw new EscrowNotExpiredError();
    }

    const remaining = escrow.amount - escrow.releasedAmount - escrow.refundedAmount;
    if (remaining <= 0) {
      throw new EscrowNotHeldError(input.escrowId);
    }

    const claimed = await this.escrows.applyRefund(
      escrow.id,
      remaining,
      { status: escrow.status, refundedAmount: escrow.refundedAmount },
      "EXPIRED",
    );
    if (!claimed) {
      throw new EscrowReleaseConflictError();
    }

    const entry = await this.ledger.postJournalEntry({
      description: `Escrow expired for ${escrow.relatedEntityType} ${escrow.relatedEntityId}`,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      lines: [
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "DEBIT", amount: remaining, currency: escrow.currency },
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "CREDIT", amount: remaining, currency: escrow.currency },
      ],
    });

    await this.transactions.record({
      type: "REFUND",
      amount: remaining,
      currency: escrow.currency,
      gatewayProvider: input.gatewayProvider,
      journalEntryId: entry.journalEntryId,
      reason: "Escrow expired",
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      idempotencyKey: input.idempotencyKey,
    });

    await this.events.publish({
      type: "EscrowExpired",
      payload: { refundAmount: remaining, currency: escrow.currency },
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
    });

    return { refundAmount: remaining };
  }
}
