import type { PrismaClient } from "@prisma/client";
import type {
  ContractMilestone,
  ContractMilestoneRepository,
  CreateContractMilestoneInput,
  MilestoneStatus,
} from "@/domain/contract/contract-milestone.repository";

export class PrismaContractMilestoneRepository implements ContractMilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateContractMilestoneInput): Promise<ContractMilestone> {
    return this.prisma.contractMilestone.create({
      data: { contractId: input.contractId, title: input.title, amount: input.amount, dueDate: input.dueDate },
    }) as unknown as Promise<ContractMilestone>;
  }

  async findById(id: string): Promise<ContractMilestone | null> {
    return this.prisma.contractMilestone.findUnique({ where: { id } }) as unknown as Promise<ContractMilestone | null>;
  }

  async listByContractId(contractId: string): Promise<ContractMilestone[]> {
    return this.prisma.contractMilestone.findMany({ where: { contractId } }) as unknown as Promise<ContractMilestone[]>;
  }

  async updateStatus(id: string, status: MilestoneStatus): Promise<ContractMilestone> {
    return this.prisma.contractMilestone.update({ where: { id }, data: { status } }) as unknown as Promise<ContractMilestone>;
  }
}
