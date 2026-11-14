import type { PrismaClient } from "@prisma/client";
import type {
  CompanyDocument,
  CompanyDocumentRepository,
  CompanyDocumentStatus,
  CreateCompanyDocumentInput,
} from "@/domain/company/company-document.repository";

export class PrismaCompanyDocumentRepository implements CompanyDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCompanyDocumentInput): Promise<CompanyDocument> {
    return this.prisma.companyDocument.create({
      data: { companyId: input.companyId, type: input.type, fileUrl: input.fileUrl },
    }) as unknown as Promise<CompanyDocument>;
  }

  async findById(id: string): Promise<CompanyDocument | null> {
    return this.prisma.companyDocument.findUnique({ where: { id } }) as unknown as Promise<CompanyDocument | null>;
  }

  async listByCompanyId(companyId: string): Promise<CompanyDocument[]> {
    return this.prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<CompanyDocument[]>;
  }

  async countByCompanyId(companyId: string): Promise<number> {
    return this.prisma.companyDocument.count({ where: { companyId } });
  }

  async updateStatus(id: string, status: CompanyDocumentStatus): Promise<CompanyDocument> {
    return this.prisma.companyDocument.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    }) as unknown as Promise<CompanyDocument>;
  }
}
