import type { ContractProjectRepository } from "@/domain/contract/contract-project.repository";
import type { ContractBid, ContractBidRepository, CreateContractBidInput } from "@/domain/contract/contract-bid.repository";
import type { ProviderProfileRepository } from "@/domain/provider/provider-profile.repository";
import { ContractProjectNotFoundError, ContractProjectNotOpenError, ProviderNotEligibleError } from "./errors";

export class SubmitContractBidUseCase {
  constructor(
    private readonly projects: ContractProjectRepository,
    private readonly bids: ContractBidRepository,
    private readonly providers: ProviderProfileRepository,
  ) {}

  async execute(input: CreateContractBidInput): Promise<ContractBid> {
    const project = await this.projects.findById(input.projectId);
    if (!project) {
      throw new ContractProjectNotFoundError();
    }
    if (project.status !== "OPEN_FOR_BIDS") {
      throw new ContractProjectNotOpenError();
    }

    const provider = await this.providers.findById(input.providerId);
    if (!provider || provider.status !== "ACTIVE" || provider.verificationStatus !== "VERIFIED") {
      throw new ProviderNotEligibleError();
    }

    return this.bids.create(input);
  }
}
