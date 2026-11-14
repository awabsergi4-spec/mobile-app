import type { CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { CompanyInvitation, CompanyInvitationRepository } from "@/domain/company/company-invitation.repository";
import type { CompanyRole } from "@/domain/company/company.entity";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { CompanyMemberInsufficientRoleError, CompanyInvitationAlreadyPendingError } from "./errors";

export interface InviteCompanyMemberInput {
  companyId: string;
  invitedById: string;
  invitedPhone: string;
  role?: CompanyRole;
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Company-level authorization (only OWNER/MANAGER may invite) is a
// business rule of this bounded context, so it's enforced here against
// CompanyMemberRepository rather than the global StaffPermission RBAC used
// for platform-admin routes (ADR-004's Company/Identity split).
export class InviteCompanyMemberUseCase {
  constructor(
    private readonly members: CompanyMemberRepository,
    private readonly invitations: CompanyInvitationRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: InviteCompanyMemberInput): Promise<CompanyInvitation> {
    const inviter = await this.members.findByCompanyAndUser(input.companyId, input.invitedById);
    if (!inviter || (inviter.role !== "OWNER" && inviter.role !== "MANAGER")) {
      throw new CompanyMemberInsufficientRoleError();
    }

    const pending = await this.invitations.findPendingByPhone(input.invitedPhone);
    if (pending.some((invitation) => invitation.companyId === input.companyId)) {
      throw new CompanyInvitationAlreadyPendingError();
    }

    const invitation = await this.invitations.create({
      companyId: input.companyId,
      invitedPhone: input.invitedPhone,
      invitedById: input.invitedById,
      role: input.role ?? "STAFF",
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });

    await this.events.publish({
      type: "CompanyMemberInvited",
      payload: { invitedPhone: input.invitedPhone, role: invitation.role },
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });

    return invitation;
  }
}
