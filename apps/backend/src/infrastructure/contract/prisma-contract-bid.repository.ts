import type { PrismaClient } from "@prisma/client";
import type {
  BidStatus,
  ContractBid,
  ContractBidRepository,
  CreateContractBidInput,
  ListByProviderFilter,
} from "@/domain/contract/contract-bid.repository";

export class PrismaContractBidRepository implements ContractBidRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateContractBidInput): Promise<ContractBid> {
    return this.prisma.contractBid.create({
      data: { projectId: input.projectId, providerId: input.providerId, amount: input.amount, message: input.message },
    }) as unknown as Promise<ContractBid>;
  }

  async findById(id: string): Promise<ContractBid | null> {
    return this.prisma.contractBid.findUnique({ where: { id } }) as unknown as Promise<ContractBid | null>;
  }

  async listByProjectId(projectId: string): Promise<ContractBid[]> {
    return this.prisma.contractBid.findMany({
      where: { projectId },
      orderBy: { submittedAt: "asc" },
    }) as unknown as Promise<ContractBid[]>;
  }

  async listByProviderId(providerId: string, filter: ListByProviderFilter): Promise<ContractBid[]> {
    return this.prisma.contractBid.findMany({
      where: { providerId, status: filter.status },
      orderBy: { submittedAt: "desc" },
      take: filter.limit ?? 25,
    }) as unknown as Promise<ContractBid[]>;
  }

  async updateStatus(id: string, status: BidStatus): Promise<ContractBid> {
    return this.prisma.contractBid.update({ where: { id }, data: { status } }) as unknown as Promise<ContractBid>;
  }

  async rejectOtherSubmittedBids(projectId: string, exceptBidId: string): Promise<void> {
    await this.prisma.contractBid.updateMany({
      where: { projectId, status: "SUBMITTED", id: { not: exceptBidId } },
      data: { status: "REJECTED" },
    });
  }
}
