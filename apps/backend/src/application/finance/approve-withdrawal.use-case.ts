import type { WithdrawalRepository } from "@/domain/finance/withdrawal-repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidWithdrawalStatusTransitionError, WithdrawalNotFoundError } from "./errors";

export interface ApproveWithdrawalInput {
  withdrawalId: string;
  approvedById: string;
}

export class ApproveWithdrawalUseCase {
  constructor(
    private readonly withdrawals: WithdrawalRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ApproveWithdrawalInput): Promise<void> {
    const withdrawal = await this.withdrawals.findById(input.withdrawalId);
    if (!withdrawal) {
      throw new WithdrawalNotFoundError();
    }
    if (withdrawal.status !== "REQUESTED" && withdrawal.status !== "PENDING_APPROVAL") {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "APPROVED");
    }

    const claimed = await this.withdrawals.compareAndSetStatus(withdrawal.id, withdrawal.status, "APPROVED", {
      approvedById: input.approvedById,
    });
    if (!claimed) {
      throw new InvalidWithdrawalStatusTransitionError(withdrawal.status, "APPROVED");
    }

    await this.auditLog.write({
      actorId: input.approvedById,
      action: "withdrawal.approve",
      entityType: "Withdrawal",
      entityId: withdrawal.id,
      metadata: { amount: withdrawal.amount, currency: withdrawal.currency },
    });

    await this.events.publish({
      type: "WithdrawalApproved",
      payload: { amount: withdrawal.amount, currency: withdrawal.currency },
      relatedEntityType: "WITHDRAWAL",
      relatedEntityId: withdrawal.id,
    });
  }
}
