import { describe, it, expect } from "vitest";
import { CreateCompanyUseCase } from "../create-company.use-case";
import { InviteCompanyMemberUseCase } from "../invite-company-member.use-case";
import { AcceptCompanyInvitationUseCase } from "../accept-company-invitation.use-case";
import {
  CompanyInvitationAlreadyPendingError,
  CompanyInvitationExpiredError,
  CompanyInvitationNotFoundError,
  CompanyMemberInsufficientRoleError,
} from "../errors";
import {
  FakeCompanyRepository,
  FakeCompanyMemberRepository,
  FakeCompanyInvitationRepository,
  FakeDomainEventPublisher,
} from "./fakes";

function buildHarness() {
  const companies = new FakeCompanyRepository();
  const members = new FakeCompanyMemberRepository();
  const invitations = new FakeCompanyInvitationRepository();
  const events = new FakeDomainEventPublisher();
  return { companies, members, invitations, events };
}

describe("InviteCompanyMemberUseCase", () => {
  it("lets the OWNER invite a new phone number", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const useCase = new InviteCompanyMemberUseCase(members, invitations, events);

    const invitation = await useCase.execute({
      companyId: company.id,
      invitedById: "owner-1",
      invitedPhone: "+15551230000",
    });

    expect(invitation.status).toBe("PENDING");
    expect(invitation.role).toBe("STAFF");
    expect(events.published).toHaveLength(1);
  });

  it("rejects invitations from a STAFF member", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    await members.add({ companyId: company.id, userId: "staff-1", role: "STAFF" });
    const useCase = new InviteCompanyMemberUseCase(members, invitations, events);

    await expect(
      useCase.execute({ companyId: company.id, invitedById: "staff-1", invitedPhone: "+15551230000" }),
    ).rejects.toBeInstanceOf(CompanyMemberInsufficientRoleError);
  });

  it("rejects a duplicate pending invitation to the same phone", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const useCase = new InviteCompanyMemberUseCase(members, invitations, events);
    await useCase.execute({ companyId: company.id, invitedById: "owner-1", invitedPhone: "+15551230000" });

    await expect(
      useCase.execute({ companyId: company.id, invitedById: "owner-1", invitedPhone: "+15551230000" }),
    ).rejects.toBeInstanceOf(CompanyInvitationAlreadyPendingError);
  });
});

describe("AcceptCompanyInvitationUseCase", () => {
  it("creates a membership with the invited role when the phone matches", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const invitation = await new InviteCompanyMemberUseCase(members, invitations, events).execute({
      companyId: company.id,
      invitedById: "owner-1",
      invitedPhone: "+15551230000",
      role: "MANAGER",
    });
    const useCase = new AcceptCompanyInvitationUseCase(invitations, members, events);

    const member = await useCase.execute({
      invitationId: invitation.id,
      acceptingUserId: "user-2",
      acceptingUserPhone: "+15551230000",
    });

    expect(member.role).toBe("MANAGER");
    const updatedInvitation = await invitations.findById(invitation.id);
    expect(updatedInvitation?.status).toBe("ACCEPTED");
  });

  it("rejects acceptance when the phone does not match the invitation", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const invitation = await new InviteCompanyMemberUseCase(members, invitations, events).execute({
      companyId: company.id,
      invitedById: "owner-1",
      invitedPhone: "+15551230000",
    });
    const useCase = new AcceptCompanyInvitationUseCase(invitations, members, events);

    await expect(
      useCase.execute({ invitationId: invitation.id, acceptingUserId: "user-2", acceptingUserPhone: "+15559999999" }),
    ).rejects.toBeInstanceOf(CompanyInvitationNotFoundError);
  });

  it("marks an expired invitation EXPIRED and rejects acceptance", async () => {
    const { companies, members, invitations, events } = buildHarness();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const expired = await invitations.create({
      companyId: company.id,
      invitedPhone: "+15551230000",
      invitedById: "owner-1",
      expiresAt: new Date(Date.now() - 1000),
    });
    const useCase = new AcceptCompanyInvitationUseCase(invitations, members, events);

    await expect(
      useCase.execute({ invitationId: expired.id, acceptingUserId: "user-2", acceptingUserPhone: "+15551230000" }),
    ).rejects.toBeInstanceOf(CompanyInvitationExpiredError);

    const updated = await invitations.findById(expired.id);
    expect(updated?.status).toBe("EXPIRED");
  });
});
