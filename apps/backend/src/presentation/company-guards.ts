import type { CompanyMember, CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { CompanyRole } from "@/domain/company/company.entity";

export class NotCompanyMemberError extends Error {
  constructor() {
    super("You are not a member of this company");
  }
}

export class CompanyRoleForbiddenError extends Error {
  constructor() {
    super("Your role does not permit this action");
  }
}

// Company-scoped authorization (is this caller a member, and does their
// CompanyMember.role permit the action) is a business rule of the Company
// bounded context — distinct from the global StaffPermission RBAC in
// presentation/auth-guards.ts, which governs platform-admin routes.
export async function requireCompanyMembership(
  companyId: string,
  userId: string,
  members: CompanyMemberRepository,
): Promise<CompanyMember> {
  const member = await members.findByCompanyAndUser(companyId, userId);
  if (!member) {
    throw new NotCompanyMemberError();
  }
  return member;
}

export async function requireCompanyRole(
  companyId: string,
  userId: string,
  allowedRoles: CompanyRole[],
  members: CompanyMemberRepository,
): Promise<CompanyMember> {
  const member = await requireCompanyMembership(companyId, userId, members);
  if (!allowedRoles.includes(member.role)) {
    throw new CompanyRoleForbiddenError();
  }
  return member;
}
