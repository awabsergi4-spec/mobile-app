import type { ContractProjectRepository } from "@/domain/contract/contract-project.repository";
import type { ContractBidRepository } from "@/domain/contract/contract-bid.repository";
import { ContractProjectNotFoundError, ContractProjectNotOpenError } from "./errors";

export interface CancelContractProjectInput {
  projectId: string;
}

// Only cancellable before award — once a bid is accepted the project's
// fate is tied to the Contract it produced, not this project record.
export class CancelContractProjectUseCase {
  constructor(
    private readonly projects: ContractProjectRepository,
    private readonly bids: ContractBidRepository,
  ) {}

  async execute(input: CancelContractProjectInput): Promise<void> {
    const project = await this.projects.findById(input.projectId);
    if (!project) {
      throw new ContractProjectNotFoundError();
    }
    if (project.status !== "OPEN_FOR_BIDS") {
      throw new ContractProjectNotOpenError();
    }

    await this.projects.updateStatus(input.projectId, "CANCELLED");

    const submittedBids = (await this.bids.listByProjectId(input.projectId)).filter((bid) => bid.status === "SUBMITTED");
    for (const bid of submittedBids) {
      await this.bids.updateStatus(bid.id, "REJECTED");
    }
  }
}
