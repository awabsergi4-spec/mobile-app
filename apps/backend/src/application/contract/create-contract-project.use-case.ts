import type { ContractProjectRepository, CreateContractProjectInput } from "@/domain/contract/contract-project.repository";
import type { ContractProject } from "@/domain/contract/contract-project.entity";

export class CreateContractProjectUseCase {
  constructor(private readonly projects: ContractProjectRepository) {}

  async execute(input: CreateContractProjectInput): Promise<ContractProject> {
    return this.projects.create(input);
  }
}
