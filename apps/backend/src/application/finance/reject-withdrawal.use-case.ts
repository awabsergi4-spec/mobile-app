import type { WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { WalletRepository } from "@/domain/finance/wallet-repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "./errors";

export interface RejectWithdrawalInput {
  withdrawalId: string;
  rejectedById: string;
  reason: string;
}

// Rejecting releases the LOCKED hold RequestWithdrawalUseCase placed —
// the funds go back to AVAILABLE, the provider can request again. No
// ledger entry: nothing ever left the platform.
export class RejectWithdrawalUseCase {
  constructor(
    private readonly withdrawals: WithdrawalRepository,
    private readonly wallets: WalletRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: RejectWithdrawalInput): Promise<void> {
    const withdrawal = await this.withdrawals.findById(input.withdrawalId);
    if (!withdrawal) {
      throw new WithdrawalNotFoundError();
    }
    if (withdrawal.status !== "REQUESTED" && withdrawal.status !== "PENDING_APPROVAL") {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "REJECTED");
    }

    const claimed = await this.withdrawals.compareAndSetStatus(withdrawal.id, withdrawal.status, "REJECTED", {
      rejectedReason: input.reason,
    });
    if (!claimed) {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "REJECTED");
    }

    const totalHold = withdrawal.amount + withdrawal.feeMinorUnits;
    await this.wallets.adjustBalance(withdrawal.walletId, "LOCKED", -totalHold);
    await this.wallets.adjustBalance(withdrawal.walletId, "AVAILABLE", totalHold);

    await this.auditLog.write({
      actorId: input.rejectedById,
      action: "withdrawal.reject",
      entityType: "Withdrawal",
      entityId: withdrawal.id,
      metadata: { reason: input.reason },
    });

    await this.events.publish({
      type: "WithdrawalRejected",
      payload: { reason: input.reason },
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
    });
  }
}
