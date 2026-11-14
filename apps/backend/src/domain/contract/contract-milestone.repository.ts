export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "PAID";

export interface ContractMilestone {
  id: string;
  contractId: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  dueDate: Date | null;
}

export interface CreateContractMilestoneInput {
  contractId: string;
  title: string;
  amount: number;
  dueDate?: Date;
}

// Interface only — implemented in infrastructure/contract/prisma-contract-milestone.repository.ts.
export interface ContractMilestoneRepository {
  create(input: CreateContractMilestoneInput): Promise<ContractMilestone>;
  findById(id: string): Promise<ContractMilestone | null>;
  listByContractId(contractId: string): Promise<ContractMilestone[]>;
  updateStatus(id: string, status: MilestoneStatus): Promise<ContractMilestone>;
}
