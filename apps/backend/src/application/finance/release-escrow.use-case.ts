import type { EscrowRepository } from "@/domain/finance/escrow-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { EscrowNotHeldError, EscrowReleaseConflictError, InvalidReleaseAmountError } from "./errors";

export interface ReleaseEscrowInput {
  escrowId: string;
  providerWalletId: string;
  commissionPercentage: number; // resolved from CommissionRule by the caller — this use case handles release mechanics, not commission-rule lookup
  gatewayProvider: string;
  // Omit for a full release of whatever remains held. A value less than
  // the remaining amount produces a PARTIALLY_RELEASED escrow — callable
  // again later for the rest (e.g. Contract milestones releasing in
  // installments from one funded escrow).
  releaseAmount?: number;
  // Financial Core Phase 11 — a retried release (double-click, queue
  // retry) with the same key is detected via the provider-share
  // PaymentTransaction it would have posted, and short-circuits before
  // touching the escrow's claim or any ledger entry a second time.
  idempotencyKey?: string;
}

// Handles both full and partial release — the single class this file's
// header comment originally flagged as "PartialReleaseEscrowUseCase
// follows the identical shape" turned out to BE this shape, not a
// separate class: releaseAmount defaulting to the full remaining amount
// covers both cases without duplicating the money-movement logic.
//
// Note: PaymentTransaction.journalEntryId is 1:1 (unique), so a release
// that splits money two ways (provider share + platform commission) posts
// TWO independently-balanced JournalEntrys — one per PaymentTransaction —
// not one 3-line entry shared across both. See domain/finance/transaction-recorder.ts.
//
// The escrow's atomic applyRelease claim happens FIRST, before any ledger
// entry or wallet credit — two concurrent releases against the same
// escrow must not both post money movements and then discover only one
// of them should have happened. See EscrowRepository.applyRelease.
//
// Publishes EscrowReleased/EscrowPartiallyReleased on success (ADR-009).
export class ReleaseEscrowUseCase {
  constructor(
    private readonly escrows: EscrowRepository,
    private readonly ledger: LedgerService,
    private readonly wallets: WalletRepository,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReleaseEscrowInput) {
    if (input.idempotencyKey) {
      const existing = await this.transactions.findByIdempotencyKey(`${input.idempotencyKey}:provider`);
      if (existing) {
        return { providerAmount: existing.amount, commissionAmount: 0, releaseAmount: existing.amount, remaining: 0 };
      }
    }

    const escrow = await this.escrows.findById(input.escrowId);
    if (!escrow || (escrow.status !== "HELD" && escrow.status !== "PARTIALLY_RELEASED")) {
      throw new EscrowNotHeldError(input.escrowId);
    }

    const remaining = escrow.amount - escrow.releasedAmount - escrow.refundedAmount;
    const releaseAmount = input.releaseAmount ?? remaining;
    if (releaseAmount <= 0 || releaseAmount > remaining) {
      throw new InvalidReleaseAmountError();
    }

    const isFullyReleased = escrow.releasedAmount + releaseAmount + escrow.refundedAmount >= escrow.amount;
    const newStatus = isFullyReleased ? "RELEASED" : "PARTIALLY_RELEASED";

    const claimed = await this.escrows.applyRelease(
      escrow.id,
      releaseAmount,
      { status: escrow.status, releasedAmount: escrow.releasedAmount },
      newStatus,
    );
    if (!claimed) {
      throw new EscrowReleaseConflictError();
    }

    const commissionAmount = Math.round(releaseAmount * (input.commissionPercentage / 100));
    const providerAmount = releaseAmount - commissionAmount;

    const providerEntry = await this.ledger.postJournalEntry({
      description: `Escrow release (provider share) for ${escrow.relatedEntityType} ${escrow.relatedEntityId}`,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      lines: [
        { ledgerAccountCode: "ESCROW_HOLDING", direction: "DEBIT", amount: providerAmount, currency: escrow.currency },
        { ledgerAccountCode: "PROVIDER_WALLETS_PAYABLE", direction: "CREDIT", amount: providerAmount, currency: escrow.currency },
      ],
    });

    await this.transactions.record({
      type: "ESCROW_RELEASE",
      amount: providerAmount,
      currency: escrow.currency,
      gatewayProvider: input.gatewayProvider,
      destinationWalletId: input.providerWalletId,
      journalEntryId: providerEntry.journalEntryId,
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
      idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:provider` : undefined,
    });

    if (commissionAmount > 0) {
      const commissionEntry = await this.ledger.postJournalEntry({
        description: `Escrow release (platform commission) for ${escrow.relatedEntityType} ${escrow.relatedEntityId}`,
        relatedEntityType: "ESCROW",
        relatedEntityId: escrow.id,
        lines: [
          { ledgerAccountCode: "ESCROW_HOLDING", direction: "DEBIT", amount: commissionAmount, currency: escrow.currency },
          { ledgerAccountCode: "COMMISSION_REVENUE", direction: "CREDIT", amount: commissionAmount, currency: escrow.currency },
        ],
      });

      await this.transactions.record({
        type: "COMMISSION",
        amount: commissionAmount,
        currency: escrow.currency,
        gatewayProvider: input.gatewayProvider,
        journalEntryId: commissionEntry.journalEntryId,
        relatedEntityType: "ESCROW",
        relatedEntityId: escrow.id,
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}:commission` : undefined,
      });
    }

    await this.wallets.adjustBalance(input.providerWalletId, "AVAILABLE", providerAmount);

    await this.events.publish({
      type: isFullyReleased ? "EscrowReleased" : "EscrowPartiallyReleased",
      payload: { providerAmount, commissionAmount, releaseAmount, currency: escrow.currency },
      relatedEntityType: "ESCROW",
      relatedEntityId: escrow.id,
    });

    return { providerAmount, commissionAmount, releaseAmount, remaining: remaining - releaseAmount };
  }
}
