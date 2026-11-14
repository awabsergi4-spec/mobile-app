import type { CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { CompanyMemberInsufficientRoleError, CompanyMemberNotFoundError, CompanyOwnerRoleProtectedError } from "./errors";

export interface RemoveCompanyMemberInput {
  memberId: string;
  actorId: string;
}

export class RemoveCompanyMemberUseCase {
  constructor(
    private readonly members: CompanyMemberRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: RemoveCompanyMemberInput): Promise<void> {
    const member = await this.members.findById(input.memberId);
    if (!member) {
      throw new CompanyMemberNotFoundError();
    }

    if (member.role === "OWNER") {
      throw new CompanyOwnerRoleProtectedError();
    }

    const actor = await this.members.findByCompanyAndUser(member.companyId, input.actorId);
    if (!actor || (actor.role !== "OWNER" && actor.role !== "MANAGER")) {
      throw new CompanyMemberInsufficientRoleError();
    }

    await this.members.remove(member.id);

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.member.remove",
      entityType: "CompanyMember",
      entityId: member.id,
      metadata: { companyId: member.companyId, removedUserId: member.userId },
    });
  }
}
