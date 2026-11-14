import type { PrismaClient } from "@prisma/client";
import type { CompanyRole } from "@/domain/company/company.entity";
import type {
  AddCompanyMemberInput,
  CompanyMember,
  CompanyMemberRepository,
} from "@/domain/company/company-member.repository";

export class PrismaCompanyMemberRepository implements CompanyMemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async add(input: AddCompanyMemberInput): Promise<CompanyMember> {
    return this.prisma.companyMember.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        role: input.role ?? "STAFF",
        branchId: input.branchId,
        departmentId: input.departmentId,
      },
    }) as unknown as Promise<CompanyMember>;
  }

  async findById(id: string): Promise<CompanyMember | null> {
    return this.prisma.companyMember.findUnique({ where: { id } }) as unknown as Promise<CompanyMember | null>;
  }

  async findByCompanyAndUser(companyId: string, userId: string): Promise<CompanyMember | null> {
    return this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
    }) as unknown as Promise<CompanyMember | null>;
  }

  async listByCompanyId(companyId: string): Promise<CompanyMember[]> {
    return this.prisma.companyMember.findMany({
      where: { companyId },
      orderBy: { joinedAt: "asc" },
    }) as unknown as Promise<CompanyMember[]>;
  }

  async updateRole(id: string, role: CompanyRole): Promise<CompanyMember> {
    return this.prisma.companyMember.update({ where: { id }, data: { role } }) as unknown as Promise<CompanyMember>;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.companyMember.delete({ where: { id } });
  }
}
