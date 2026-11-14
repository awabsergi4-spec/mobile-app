import type { SettlementRepository } from "@/domain/finance/settlement-repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { InvalidSettlementStatusTransitionError, SettlementNotFoundError } from "./errors";

export interface CompleteSettlementInput {
  settlementId: string;
}

// Called once every Withdrawal in the batch has been individually marked
// PAID or FAILED (via MarkWithdrawalPaidUseCase/MarkWithdrawalFailedUseCase
// — this use case doesn't touch withdrawals itself, it just closes the
// batch record out). PROCESSING -> COMPLETED unconditionally: a
// settlement "completing" means the batch run finished, not that every
// item within it succeeded — which items failed is visible on the
// Withdrawal rows themselves, not by inventing a partial-completion
// SettlementStatus the schema doesn't have.
export class CompleteSettlementUseCase {
  constructor(
    private readonly settlements: SettlementRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CompleteSettlementInput): Promise<void> {
    const settlement = await this.settlements.findById(input.settlementId);
    if (!settlement) {
      throw new SettlementNotFoundError();
    }
    if (settlement.status !== "PENDING" && settlement.status !== "PROCESSING") {
      throw new InvalidSettlementStatusTransitionError(settlement.status, "COMPLETED");
    }

    const claimed = await this.settlements.compareAndSetStatus(settlement.id, settlement.status, "COMPLETED", {
      processedAt: new Date(),
    });
    if (!claimed) {
      throw new InvalidSettlementStatusTransitionError(settlement.status, "COMPLETED");
    }

    await this.events.publish({
      type: "SettlementCompleted",
      payload: { totalAmount: settlement.totalAmount, currency: settlement.currency },
      relatedEntityType: "SETTLEMENT",
      relatedEntityId: settlement.id,
    });
  }
}
