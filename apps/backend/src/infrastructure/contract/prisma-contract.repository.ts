import type { PrismaClient } from "@prisma/client";
import type { Contract, ContractStatus } from "@/domain/contract/contract.entity";
import type { ContractRepository, CreateContractInput } from "@/domain/contract/contract.repository";

export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateContractInput): Promise<Contract> {
    return this.prisma.contract.create({
      data: { projectId: input.projectId, providerId: input.providerId, totalAmount: input.totalAmount },
    }) as unknown as Promise<Contract>;
  }

  async findById(id: string): Promise<Contract | null> {
    return this.prisma.contract.findUnique({ where: { id } }) as unknown as Promise<Contract | null>;
  }

  async findByProjectId(projectId: string): Promise<Contract | null> {
    return this.prisma.contract.findUnique({ where: { projectId } }) as unknown as Promise<Contract | null>;
  }

  async updateStatus(id: string, status: ContractStatus, details?: { completedAt?: Date }): Promise<Contract> {
    return this.prisma.contract.update({
      where: { id },
      data: { status, completedAt: details?.completedAt },
    }) as unknown as Promise<Contract>;
  }
}
