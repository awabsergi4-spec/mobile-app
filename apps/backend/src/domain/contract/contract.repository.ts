import type { Contract, ContractStatus } from "./contract.entity";

export interface CreateContractInput {
  projectId: string;
  providerId: string;
  totalAmount: number;
}

// Interface only — implemented in infrastructure/contract/prisma-contract.repository.ts.
export interface ContractRepository {
  create(input: CreateContractInput): Promise<Contract>;
  findById(id: string): Promise<Contract | null>;
  findByProjectId(projectId: string): Promise<Contract | null>;
  updateStatus(id: string, status: ContractStatus, details?: { completedAt?: Date }): Promise<Contract>;
}
