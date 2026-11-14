import { describe, it, expect } from "vitest";
import { CreateCompanyUseCase } from "../create-company.use-case";
import { RemoveCompanyMemberUseCase } from "../remove-company-member.use-case";
import { UpdateCompanyMemberRoleUseCase } from "../update-company-member-role.use-case";
import { CompanyMemberInsufficientRoleError, CompanyOwnerRoleProtectedError } from "../errors";
import { FakeCompanyRepository, FakeCompanyMemberRepository, FakeAuditLogWriter } from "./fakes";

async function setupCompanyWithStaff() {
  const companies = new FakeCompanyRepository();
  const members = new FakeCompanyMemberRepository();
  const auditLog = new FakeAuditLogWriter();
  const company = await new CreateCompanyUseCase(companies, members).execute({
    ownerId: "owner-1",
    name: "Sahl Facilities",
    regionId: "region-1",
  });
  const staff = await members.add({ companyId: company.id, userId: "staff-1", role: "STAFF" });
  const ownerMember = await members.findByCompanyAndUser(company.id, "owner-1");
  return { companies, members, auditLog, company, staff, ownerMember: ownerMember! };
}

describe("RemoveCompanyMemberUseCase", () => {
  it("lets the owner remove a STAFF member", async () => {
    const { members, auditLog, staff } = await setupCompanyWithStaff();
    const useCase = new RemoveCompanyMemberUseCase(members, auditLog);

    await useCase.execute({ memberId: staff.id, actorId: "owner-1" });

    expect(await members.findById(staff.id)).toBeNull();
    expect(auditLog.entries).toHaveLength(1);
  });

  it("refuses to remove the OWNER", async () => {
    const { members, auditLog, ownerMember } = await setupCompanyWithStaff();
    const useCase = new RemoveCompanyMemberUseCase(members, auditLog);

    await expect(useCase.execute({ memberId: ownerMember.id, actorId: "owner-1" })).rejects.toBeInstanceOf(
      CompanyOwnerRoleProtectedError,
    );
  });

  it("refuses removal requested by a STAFF actor", async () => {
    const { members, auditLog, company, staff } = await setupCompanyWithStaff();
    const anotherStaff = await members.add({ companyId: company.id, userId: "staff-2", role: "STAFF" });
    const useCase = new RemoveCompanyMemberUseCase(members, auditLog);

    await expect(useCase.execute({ memberId: staff.id, actorId: anotherStaff.userId })).rejects.toBeInstanceOf(
      CompanyMemberInsufficientRoleError,
    );
  });
});

describe("UpdateCompanyMemberRoleUseCase", () => {
  it("lets the owner promote STAFF to MANAGER", async () => {
    const { members, auditLog, staff } = await setupCompanyWithStaff();
    const useCase = new UpdateCompanyMemberRoleUseCase(members, auditLog);

    const updated = await useCase.execute({ memberId: staff.id, role: "MANAGER", actorId: "owner-1" });

    expect(updated.role).toBe("MANAGER");
  });

  it("refuses to change the OWNER's role", async () => {
    const { members, auditLog, ownerMember } = await setupCompanyWithStaff();
    const useCase = new UpdateCompanyMemberRoleUseCase(members, auditLog);

    await expect(
      useCase.execute({ memberId: ownerMember.id, role: "MANAGER", actorId: "owner-1" }),
    ).rejects.toBeInstanceOf(CompanyOwnerRoleProtectedError);
  });

  it("refuses a role change requested by a non-owner actor", async () => {
    const { members, auditLog, company, staff } = await setupCompanyWithStaff();
    const manager = await members.add({ companyId: company.id, userId: "manager-1", role: "MANAGER" });
    const useCase = new UpdateCompanyMemberRoleUseCase(members, auditLog);

    await expect(
      useCase.execute({ memberId: staff.id, role: "MANAGER", actorId: manager.userId }),
    ).rejects.toBeInstanceOf(CompanyMemberInsufficientRoleError);
  });
});
