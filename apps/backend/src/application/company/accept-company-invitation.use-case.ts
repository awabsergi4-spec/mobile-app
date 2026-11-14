import type { CompanyInvitationRepository } from "@/domain/company/company-invitation.repository";
import type { CompanyMember, CompanyMemberRepository } from "@/domain/company/company-member.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  CompanyInvitationExpiredError,
  CompanyInvitationNotFoundError,
  CompanyInvitationNotPendingError,
  CompanyMemberAlreadyExistsError,
} from "./errors";

export interface AcceptCompanyInvitationInput {
  invitationId: string;
  acceptingUserId: string;
  acceptingUserPhone: string;
}

// Phone-match check (invitedPhone must equal the accepting user's own
// phone) prevents one user from accepting an invitation addressed to
// someone else's number — the only authorization this flow needs, since
// the invitation itself is the capability token.
export class AcceptCompanyInvitationUseCase {
  constructor(
    private readonly invitations: CompanyInvitationRepository,
    private readonly members: CompanyMemberRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: AcceptCompanyInvitationInput): Promise<CompanyMember> {
    const invitation = await this.invitations.findById(input.invitationId);
    if (!invitation || invitation.invitedPhone !== input.acceptingUserPhone) {
      throw new CompanyInvitationNotFoundError();
    }

    if (invitation.status !== "PENDING") {
      throw new CompanyInvitationNotPendingError();
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.invitations.updateStatus(invitation.id, "EXPIRED");
      throw new CompanyInvitationExpiredError();
    }

    const existingMembership = await this.members.findByCompanyAndUser(invitation.companyId, input.acceptingUserId);
    if (existingMembership) {
      throw new CompanyMemberAlreadyExistsError();
    }

    const member = await this.members.add({
      companyId: invitation.companyId,
      userId: input.acceptingUserId,
      role: invitation.role,
    });

    await this.invitations.updateStatus(invitation.id, "ACCEPTED", { respondedAt: new Date() });

    await this.events.publish({
      type: "CompanyInvitationAccepted",
      payload: { role: invitation.role, userId: input.acceptingUserId },
      relatedEntityType: "COMPANY",
      relatedEntityId: invitation.companyId,
    });

    return member;
  }
}
