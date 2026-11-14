import { describe, it, expect } from "vitest";
import { CreateCompanyUseCase } from "../create-company.use-case";
import { SubmitCompanyVerificationUseCase } from "../submit-company-verification.use-case";
import { CompanyVerificationDocumentsRequiredError } from "../errors";
import {
  FakeCompanyRepository,
  FakeCompanyMemberRepository,
  FakeCompanyDocumentRepository,
  FakeDomainEventPublisher,
} from "./fakes";

describe("SubmitCompanyVerificationUseCase", () => {
  it("rejects submission with zero uploaded documents", async () => {
    const companies = new FakeCompanyRepository();
    const members = new FakeCompanyMemberRepository();
    const documents = new FakeCompanyDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    const useCase = new SubmitCompanyVerificationUseCase(companies, documents, events);

    await expect(useCase.execute({ companyId: company.id })).rejects.toBeInstanceOf(
      CompanyVerificationDocumentsRequiredError,
    );
  });

  it("transitions to PENDING_REVIEW once a document exists", async () => {
    const companies = new FakeCompanyRepository();
    const members = new FakeCompanyMemberRepository();
    const documents = new FakeCompanyDocumentRepository();
    const events = new FakeDomainEventPublisher();
    const company = await new CreateCompanyUseCase(companies, members).execute({
      ownerId: "owner-1",
      name: "Sahl Facilities",
      regionId: "region-1",
    });
    await documents.create({ companyId: company.id, type: "trade_license", fileUrl: "https://cdn.example.com/x.pdf" });
    const useCase = new SubmitCompanyVerificationUseCase(companies, documents, events);

    await useCase.execute({ companyId: company.id });

    const updated = await companies.findById(company.id);
    expect(updated?.verificationStatus).toBe("PENDING_REVIEW");
    expect(events.published[0]).toMatchObject({ type: "CompanyVerificationSubmitted", relatedEntityType: "COMPANY" });
  });
});
