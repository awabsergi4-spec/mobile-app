import type { PrismaClient } from "@prisma/client";
import type { ContractProject, ContractProjectStatus } from "@/domain/contract/contract-project.entity";
import type {
  ContractProjectRepository,
  CreateContractProjectInput,
  ListByCustomerFilter,
  SearchContractProjectsFilter,
} from "@/domain/contract/contract-project.repository";

export class PrismaContractProjectRepository implements ContractProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateContractProjectInput): Promise<ContractProject> {
    return this.prisma.contractProject.create({
      data: {
        customerId: input.customerId,
        companyId: input.companyId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
      },
    }) as unknown as Promise<ContractProject>;
  }

  async findById(id: string): Promise<ContractProject | null> {
    return this.prisma.contractProject.findUnique({ where: { id } }) as unknown as Promise<ContractProject | null>;
  }

  async updateStatus(id: string, status: ContractProjectStatus): Promise<ContractProject> {
    return this.prisma.contractProject.update({ where: { id }, data: { status } }) as unknown as Promise<ContractProject>;
  }

  async compareAndSetStatus(id: string, fromStatus: ContractProjectStatus, toStatus: ContractProjectStatus): Promise<boolean> {
    const result = await this.prisma.contractProject.updateMany({
      where: { id, status: fromStatus },
      data: { status: toStatus },
    });
    return result.count === 1;
  }

  async search(filter: SearchContractProjectsFilter): Promise<ContractProject[]> {
    return this.prisma.contractProject.findMany({
      where: { status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<ContractProject[]>;
  }

  async listByCustomerId(customerId: string, filter: ListByCustomerFilter): Promise<ContractProject[]> {
    return this.prisma.contractProject.findMany({
      where: { customerId, status: filter.status },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<ContractProject[]>;
  }
}
