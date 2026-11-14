import type { PrismaClient } from "@prisma/client";
import type {
  CompanyInvitation,
  CompanyInvitationRepository,
  CompanyInvitationStatus,
  CreateCompanyInvitationInput,
} from "@/domain/company/company-invitation.repository";

export class PrismaCompanyInvitationRepository implements CompanyInvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCompanyInvitationInput): Promise<CompanyInvitation> {
    return this.prisma.companyInvitation.create({
      data: {
        companyId: input.companyId,
        invitedPhone: input.invitedPhone,
        invitedById: input.invitedById,
        expiresAt: input.expiresAt,
        role: input.role ?? "STAFF",
      },
    }) as unknown as Promise<CompanyInvitation>;
  }

  async findById(id: string): Promise<CompanyInvitation | null> {
    return this.prisma.companyInvitation.findUnique({ where: { id } }) as unknown as Promise<CompanyInvitation | null>;
  }

  async findPendingByPhone(phone: string): Promise<CompanyInvitation[]> {
    return this.prisma.companyInvitation.findMany({
      where: { invitedPhone: phone, status: "PENDING" },
    }) as unknown as Promise<CompanyInvitation[]>;
  }

  async listByCompanyId(companyId: string): Promise<CompanyInvitation[]> {
    return this.prisma.companyInvitation.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<CompanyInvitation[]>;
  }

  async updateStatus(
    id: string,
    status: CompanyInvitationStatus,
    details?: { respondedAt?: Date },
  ): Promise<CompanyInvitation> {
    return this.prisma.companyInvitation.update({
      where: { id },
      data: { status, respondedAt: details?.respondedAt },
    }) as unknown as Promise<CompanyInvitation>;
  }
}
