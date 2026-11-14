import type { CompanyInvitationRepository } from "@/domain/company/company-invitation.repository";
import type { CompanyMemberRepository } from "@/domain/company/company-member.repository";
import { CompanyInvitationNotFoundError, CompanyInvitationNotPendingError, CompanyMemberInsufficientRoleError } from "./errors";

export interface CancelCompanyInvitationInput {
  invitationId: string;
  actorId: string;
}

export class CancelCompanyInvitationUseCase {
  constructor(
    private readonly invitations: CompanyInvitationRepository,
    private readonly members: CompanyMemberRepository,
  ) {}

  async execute(input: CancelCompanyInvitationInput): Promise<void> {
    const invitation = await this.invitations.findById(input.invitationId);
    if (!invitation) {
      throw new CompanyInvitationNotFoundError();
    }

    const actor = await this.members.findByCompanyAndUser(invitation.companyId, input.actorId);
    if (!actor || (actor.role !== "OWNER" && actor.role !== "MANAGER")) {
      throw new CompanyMemberInsufficientRoleError();
    }

    if (invitation.status !== "PENDING") {
      throw new CompanyInvitationNotPendingError();
    }

    await this.invitations.updateStatus(invitation.id, "CANCELLED", { respondedAt: new Date() });
  }
}
