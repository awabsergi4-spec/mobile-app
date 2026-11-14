import type { WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { LedgerService } from "@/domain/finance/ledger-service";
import type { TransactionRecorder } from "@/domain/finance/transaction-recorder";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "./errors";

export interface MarkWithdrawalPaidInput {
  withdrawalId: string;
  gatewayProvider: string;
  gatewayRef?: string;
  idempotencyKey: string;
}

// The money actually leaves the platform here — Debit
// PROVIDER_WALLETS_PAYABLE / Credit CASH_AT_PAYMENT_PROVIDER for the full
// amount + fee. The existing chart of accounts (docs/09-financial-core.md
// §1) has no dedicated "withdrawal fee revenue" LedgerAccount — only
// PROCESSING_FEE_EXPENSE (fees a gateway charges the platform, the
// opposite direction). Recognizing withdrawal fees as their own revenue
// line is a one-row admin-configured LedgerAccount addition, not a code
// change, once finance ops names and approves the account code; flagged
// here rather than inventing one unapproved.
export class MarkWithdrawalPaidUseCase {
  constructor(
    private readonly withdrawals: WithdrawalRepository,
    private readonly wallets: WalletRepository,
    private readonly ledger: LedgerService,
    private readonly transactions: TransactionRecorder,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: MarkWithdrawalPaidInput): Promise<void> {
    const existing = await this.transactions.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return;
    }

    const withdrawal = await this.withdrawals.findById(input.withdrawalId);
    if (!withdrawal) {
      throw new WithdrawalNotFoundError();
    }
    if (withdrawal.status !== "PROCESSING") {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "PAID");
    }

    const claimed = await this.withdrawals.compareAndSetStatus(withdrawal.id, "PROCESSING", "PAID", {
      paidAt: new Date(),
    });
    if (!claimed) {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "PAID");
    }

    const totalHold = withdrawal.amount + withdrawal.feeMinorUnits;

    const entry = await this.ledger.postJournalEntry({
      description: `Withdrawal paid for provider ${withdrawal.providerId}`,
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
      lines: [
        { ledgerAccountCode: "PROVIDER_WALLETS_PAYABLE", direction: "DEBIT", amount: totalHold, currency: withdrawal.currency },
        { ledgerAccountCode: "CASH_AT_PAYMENT_PROVIDER", direction: "CREDIT", amount: totalHold, currency: withdrawal.currency },
      ],
    });

    await this.transactions.record({
      type: "WITHDRAWAL",
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      gatewayProvider: input.gatewayProvider,
      gatewayRef: input.gatewayRef,
      journalEntryId: entry.journalEntryId,
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
      idempotencyKey: input.idempotencyKey,
    });

    // The funds have now truly left — remove them from LOCKED entirely
    // (they never go back to AVAILABLE, unlike reject/fail).
    await this.wallets.adjustBalance(withdrawal.walletId, "LOCKED", -totalHold);

    await this.events.publish({
      type: "WithdrawalPaid",
      payload: { amount: withdrawal.amount, currency: withdrawal.currency },
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
    });
  }
}
