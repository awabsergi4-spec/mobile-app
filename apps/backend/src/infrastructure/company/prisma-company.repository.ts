import type { PrismaClient } from "@prisma/client";
import type { AccountLifecycleStatus, Company, VerificationStatus } from "@/domain/company/company.entity";
import type { CompanyRepository, CreateCompanyInput, UpdateCompanyInput, SearchCompaniesFilter } from "@/domain/company/company.repository";

export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCompanyInput): Promise<Company> {
    return this.prisma.company.create({
      data: {
        ownerId: input.ownerId,
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
        regionId: input.regionId,
      },
    }) as unknown as Promise<Company>;
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { id } }) as unknown as Promise<Company | null>;
  }

  async findByOwnerId(ownerId: string): Promise<Company | null> {
    return this.prisma.company.findFirst({ where: { ownerId } }) as unknown as Promise<Company | null>;
  }

  async update(id: string, input: UpdateCompanyInput): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data: input }) as unknown as Promise<Company>;
  }

  async updateLifecycleStatus(id: string, status: AccountLifecycleStatus, details?: { reason?: string }): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: {
        status,
        suspendedAt: status === "SUSPENDED" ? new Date() : null,
        suspendedReason: status === "SUSPENDED" ? details?.reason : null,
        deletedAt: status === "DELETED" ? new Date() : null,
      },
    });
  }

  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : undefined },
    });
  }

  async search(filter: SearchCompaniesFilter): Promise<Company[]> {
    return this.prisma.company.findMany({
      where: {
        status: filter.status,
        verificationStatus: filter.verificationStatus,
        ...(filter.query ? { name: { contains: filter.query, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 25,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    }) as unknown as Promise<Company[]>;
  }
}
