import type {
  ContractMilestone,
  ContractMilestoneRepository,
  CreateContractMilestoneInput,
} from "@/domain/contract/contract-milestone.repository";
import type { ContractRepository } from "@/domain/contract/contract.repository";
import { ContractNotFoundError, InvalidContractStatusTransitionError } from "./errors";

export class CreateContractMilestoneUseCase {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly milestones: ContractMilestoneRepository,
  ) {}

  async execute(input: CreateContractMilestoneInput): Promise<ContractMilestone> {
    const contract = await this.contracts.findById(input.contractId);
    if (!contract) {
      throw new ContractNotFoundError();
    }
    if (contract.status !== "IN_PROGRESS") {
      throw new InvalidContractStatusTransitionError(contract.status, "MILESTONE_CREATION");
    }

    return this.milestones.create(input);
  }
}
