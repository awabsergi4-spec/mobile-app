import type { CompanyRepository } from "@/domain/company/company.repository";
import type { CompanyDocumentRepository } from "@/domain/company/company-document.repository";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import {
  CompanyNotFoundError,
  CompanyVerificationAlreadyPendingError,
  CompanyVerificationDocumentsRequiredError,
} from "./errors";

export interface SubmitCompanyVerificationInput {
  companyId: string;
}

// Mirrors SubmitProviderVerificationUseCase exactly: requires ≥1
// CompanyDocument, transitions verificationStatus to PENDING_REVIEW,
// publishes CompanyVerificationSubmitted for the Workflow Engine (ADR-009).
export class SubmitCompanyVerificationUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly documents: CompanyDocumentRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: SubmitCompanyVerificationInput): Promise<void> {
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    if (company.verificationStatus === "PENDING_REVIEW") {
      throw new CompanyVerificationAlreadyPendingError();
    }

    const documentCount = await this.documents.countByCompanyId(input.companyId);
    if (documentCount < 1) {
      throw new CompanyVerificationDocumentsRequiredError();
    }

    await this.companies.updateVerificationStatus(input.companyId, "PENDING_REVIEW");

    await this.events.publish({
      type: "CompanyVerificationSubmitted",
      payload: {},
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });
  }
}
