import type { CompanyMember, CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { CompanyRole } from "@/domain/company/company.entity";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { CompanyMemberInsufficientRoleError, CompanyMemberNotFoundError, CompanyOwnerRoleProtectedError } from "./errors";

export interface UpdateCompanyMemberRoleInput {
  memberId: string;
  role: CompanyRole;
  actorId: string;
}

export class UpdateCompanyMemberRoleUseCase {
  constructor(
    private readonly members: CompanyMemberRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: UpdateCompanyMemberRoleInput): Promise<CompanyMember> {
    const member = await this.members.findById(input.memberId);
    if (!member) {
      throw new CompanyMemberNotFoundError();
    }

    if (member.role === "OWNER" || input.role === "OWNER") {
      throw new CompanyOwnerRoleProtectedError();
    }

    const actor = await this.members.findByCompanyAndUser(member.companyId, input.actorId);
    if (!actor || actor.role !== "OWNER") {
      throw new CompanyMemberInsufficientRoleError();
    }

    const updated = await this.members.updateRole(member.id, input.role);

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.member.update_role",
      entityType: "CompanyMember",
      entityId: member.id,
      metadata: { companyId: member.companyId, role: input.role },
    });

    return updated;
  }
}
