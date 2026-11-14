import type { CompanyRole } from "./company.entity";

export type CompanyInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export interface CompanyInvitation {
  id: string;
  companyId: string;
  invitedPhone: string;
  role: CompanyRole;
  status: CompanyInvitationStatus;
  invitedById: string;
  expiresAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
}

export interface CreateCompanyInvitationInput {
  companyId: string;
  invitedPhone: string;
  invitedById: string;
  expiresAt: Date;
  role?: CompanyRole;
}

// Interface only — implemented in infrastructure/company/prisma-company-invitation.repository.ts.
export interface CompanyInvitationRepository {
  create(input: CreateCompanyInvitationInput): Promise<CompanyInvitation>;
  findById(id: string): Promise<CompanyInvitation | null>;
  findPendingByPhone(phone: string): Promise<CompanyInvitation[]>;
  listByCompanyId(companyId: string): Promise<CompanyInvitation[]>;
  updateStatus(id: string, status: CompanyInvitationStatus, details?: { respondedAt?: Date }): Promise<CompanyInvitation>;
}
