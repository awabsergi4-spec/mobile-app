import type { ContractProject, ContractProjectStatus } from "./contract-project.entity";

export interface CreateContractProjectInput {
  customerId: string;
  categoryId: string;
  title: string;
  description: string;
  companyId?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export interface SearchContractProjectsFilter {
  status?: ContractProjectStatus;
  limit?: number;
  cursor?: string;
}

export interface ListByCustomerFilter {
  status?: ContractProjectStatus;
  limit?: number;
  cursor?: string;
}

// Interface only — implemented in infrastructure/contract/prisma-contract-project.repository.ts.
export interface ContractProjectRepository {
  create(input: CreateContractProjectInput): Promise<ContractProject>;
  findById(id: string): Promise<ContractProject | null>;
  search(filter: SearchContractProjectsFilter): Promise<ContractProject[]>;
  // The customer's own posted projects — what Flutter's "My Projects"
  // list needs, scoped server-side to `customerId`.
  listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<ContractProject[]>;
  updateStatus(id: string, status: ContractProjectStatus): Promise<ContractProject>;
  // Atomic conditional transition (UPDATE ... WHERE id = ? AND status = ?)
  // — returns false if the row wasn't in `fromStatus` when the write ran,
  // meaning a concurrent request already changed it. Used by
  // AwardContractBidUseCase so two bids on the same project racing to be
  // awarded can't both win: a plain read-then-write would let both pass
  // the "is this project still OPEN_FOR_BIDS" check before either commit.
  compareAndSetStatus(id: string, fromStatus: ContractProjectStatus, toStatus: ContractProjectStatus): Promise<boolean>;
}
