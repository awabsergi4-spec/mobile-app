import { describe, it, expect } from "vitest";
import { CreateCompanyUseCase } from "../create-company.use-case";
import { CompanyAlreadyExistsError } from "../errors";
import { FakeCompanyRepository, FakeCompanyMemberRepository } from "./fakes";

describe("CreateCompanyUseCase", () => {
  it("creates a company and an OWNER membership for the owner in one operation", async () => {
    const companies = new FakeCompanyRepository();
    const members = new FakeCompanyMemberRepository();
    const useCase = new CreateCompanyUseCase(companies, members);

    const company = await useCase.execute({ ownerId: "user-1", name: "Sahl Facilities", regionId: "region-1" });

    expect(company.ownerId).toBe("user-1");
    const membership = await members.findByCompanyAndUser(company.id, "user-1");
    expect(membership?.role).toBe("OWNER");
  });

  it("rejects a second company for the same owner", async () => {
    const companies = new FakeCompanyRepository();
    const members = new FakeCompanyMemberRepository();
    const useCase = new CreateCompanyUseCase(companies, members);

    await useCase.execute({ ownerId: "user-1", name: "Sahl Facilities", regionId: "region-1" });

    await expect(
      useCase.execute({ ownerId: "user-1", name: "Second Co", regionId: "region-1" }),
    ).rejects.toBeInstanceOf(CompanyAlreadyExistsError);
  });
});
