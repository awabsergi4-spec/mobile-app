import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";

export interface FundEscrowInput {
  amount: number;
  currency: string;
  relatedEntityType: string;
  relatedEntityId: string;
  gatewayProvider: string;
  // The originating captured payment's gateway reference (from
  // InitiatePaymentUseCase/CapturePaymentUseCase) — carried onto the
  // ESCROW_HOLD transaction so RefundPaymentUseCase can later find it and
  // actually call the gateway's refund API against the right charge.
  gatewayRef?: string;
  expiresAt?: Date;
  idempotencyKey: string;
}

// The "Create Escrow" + "Fund Escrow" phases of Phase 4's flow, combined:
// an Escrow only ever exists because it's funded (there's no meaningful
// "created but empty" escrow state in this schema), so creating the row
// and posting the funding journal entry happen together, atomically
// enough that a failure between them can't leave an un-funded Escrow
// silently sitting there — see EscrowRepository.create's unique-constraint
// backstop for the concurrent-double-fund case.
//
// Debit CASH_AT_PAYMENT_PROVIDER / Credit ESCROW_HOLDING — money that was
// already captured from the customer (by CapturePaymentUseCase) moving
// from "generic platform cash" into "held for this specific transaction."
export class FundEscrowUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: FundEscrowInput): Promise<{ escrowId: string }> {
    const existingByKey = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existingByKey) {
      const escrow = await this.escrows.findByRelatedEntity(input.relatedEntityType, input.relatedEntityId);
      if (escrow) {
        return { escrowId: escrow.id };
      }
    }

    const escrow = await this.escrows.create({
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      amount: input.amount,
      currency: input.currency,
      expiresAt: input.expiresAt,
    });

    const entry = await this.ledger.postJournalEntry({
      description: `Escrow funded for ${input.relatedEntityType} ${input.relatedEntityId}`,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      lines: [
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "DEBIT", amount: input.amount, currency: input.currency },
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "CREDIT", amount: input.amount, currency: input.currency },
      ],
    });

    await this.transactions.record({
      type: "ESCROW_HOLD",
      amount: input.amount,
      currency: input.currency,
      gatewayProvider: input.gatewayProvider,
      gatewayRef: input.gatewayRef,
      journalEntryId: entry.journalEntryId,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      idempotencyKey: input.idempotencyKey,
    });

    await this.events.publish({
      type: "EscrowFunded",
      payload: { amount: input.amount, currency: input.currency },
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
    });

    return { escrowId: escrow.id };
  }
}
