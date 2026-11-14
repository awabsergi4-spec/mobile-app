import type { Contract } from "@/domain/contract/contract.entity";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import type { ContractMilestoneRepository } from "@/domain/contract/contract-milestone.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { ContractHasUnpaidMilestonesError, ContractNotFoundError, InvalidContractStatusTransitionError } from "./errors";

export interface CompleteContractInput {
  contractId: string;
}

export class CompleteContractUseCase {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly milestones: ContractMilestoneRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: CompleteContractInput): Promise<Contract> {
    const contract = await this.contracts.findById(input.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }
    if (contract.status !== "IN_PROGRESS") {
      throw new InvalidContractStatusTransitionError(contract.status, "COMPLETED");
    }

    const contractMilestones = await this.milestones.listByContractId(input.contractId);
    const hasUnpaidMilestone = contractMilestones.some((milestone) => milestone.status !== "PAID");
    if (contractMilestones.length > 0 && hasUnpaidMilestone) {
      throw new ContractHasUnpaidMilestonesError();
    }

    const updated = await this.contracts.updateStatus(input.contractId, "COMPLETED", { completedAt: new Date() });

    await this.events.publish({
      type: "ContractCompleted",
      payload: {},
      relatedEntityType: "CONTRACT",
      relatedEntityId: contract.id,
    });

    return updated;
  }
}
