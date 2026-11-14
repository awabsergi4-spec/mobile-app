import type { ContractRepository } from "@/domain/contract/contract.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { ContractNotFoundError, InvalidContractStatusTransitionError } from "./errors";

export interface CancelContractInput {
  contractId: string;
  cancelledByUserId: string;
}

export class CancelContractUseCase {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CancelContractInput): Promise<void> {
    const contract = await this.contracts.findById(input.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }
    if (contract.status !== "IN_PROGRESS") {
      throw new InvalidContractStatusTransitionError(contract.status, "CANCELLED");
    }

    await this.contracts.updateStatus(input.contractId, "CANCELLED");

    await this.events.publish({
      type: "ContractCancelled",
      payload: { cancelledByUserId: input.cancelledByUserId },
      relatedEntityType: "CONTRACT",
      relatedEntityId: contract.id,
    });
  }
}
