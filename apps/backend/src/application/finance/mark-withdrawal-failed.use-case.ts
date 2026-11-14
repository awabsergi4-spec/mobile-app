import type { WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "./errors";

export interface MarkWithdrawalFailedInput {
  withdrawalId: string;
  reason: string;
}

// A processing failure (gateway rejected the payout, bank details
// invalid, etc.) releases the LOCKED hold back to AVAILABLE — same
// compensating action as RejectWithdrawalUseCase, since nothing actually
// left the platform. The provider can submit a fresh withdrawal request;
// this one stays FAILED as a record, not resurrected in place.
export class MarkWithdrawalFailedUseCase {
  constructor(
    private readonly withdrawals: WithdrawalRepository,
    private readonly wallets: WalletRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: MarkWithdrawalFailedInput): Promise<void> {
    const withdrawal = await this.withdrawals.findById(input.withdrawalId);
    if (!withdrawal) {
      throw new WithdrawalNotFoundError();
    }
    if (withdrawal.status !== "PROCESSING") {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "FAILED");
    }

    const claimed = await this.withdrawals.compareAndSetStatus(withdrawal.id, "PROCESSING", "FAILED", {
      rejectedReason: input.reason,
    });
    if (!claimed) {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "FAILED");
    }

    const totalHold = withdrawal.amount + withdrawal.feeMinorUnits;
    await this.wallets.adjustBalance(withdrawal.walletId, "LOCKED", -totalHold);
    await this.wallets.adjustBalance(withdrawal.walletId, "AVAILABLE", totalHold);

    await this.events.publish({
      type: "WithdrawalFailed",
      payload: { reason: input.reason },
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
    });
  }
}
