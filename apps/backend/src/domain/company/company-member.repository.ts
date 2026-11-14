import type { CompanyRole } from "./company.entity";

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
  branchId: string | null;
  departmentId: string | null;
  joinedAt: Date;
}

export interface AddCompanyMemberInput {
  companyId: string;
  userId: string;
  role?: CompanyRole;
  branchId?: string;
  departmentId?: string;
}

// Interface only — implemented in infrastructure/company/prisma-company-member.repository.ts.
export interface CompanyMemberRepository {
  add(input: AddCompanyMemberInput): Promise<CompanyMember>;
  findById(id: string): Promise<CompanyMember | null>;
  findByCompanyAndUser(companyId: string, userId: string): Promise<CompanyMember | null>;
  listByCompanyId(companyId: string): Promise<CompanyMember[]>;
  updateRole(id: string, role: CompanyRole): Promise<CompanyMember>;
  remove(id: string): Promise<void>;
}
