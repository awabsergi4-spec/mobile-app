import type { PrismaClient } from "@prisma/client";
import type {
  ContractDocument,
  ContractDocumentRepository,
  CreateContractDocumentInput,
} from "@/domain/contract/contract-document.repository";

export class PrismaContractDocumentRepository implements ContractDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateContractDocumentInput): Promise<ContractDocument> {
    const existingCount = await this.prisma.contractDocument.count({ where: { contractId: input.contractId } });
    return this.prisma.contractDocument.create({
      data: {
        contractId: input.contractId,
        uploaderId: input.uploaderId,
        fileUrl: input.fileUrl,
        version: existingCount + 1,
      },
    });
  }

  async listByContractId(contractId: string): Promise<ContractDocument[]> {
    return this.prisma.contractDocument.findMany({
      where: { contractId },
      orderBy: { version: "asc" },
    });
  }

  async countByContractId(contractId: string): Promise<number> {
    return this.prisma.contractDocument.count({ where: { contractId } });
  }
}
