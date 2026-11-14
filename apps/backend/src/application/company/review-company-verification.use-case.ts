import type { CompanyRepository } from "@/domain/company/company.repository";
import type { VerificationStatus } from "@/domain/company/company.entity";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { CompanyNotFoundError } from "./errors";

export interface ReviewCompanyVerificationInput {
  companyId: string;
  decision: "VERIFIED" | "REJECTED" | "NEEDS_MORE_INFO";
  reason?: string;
  actorId: string;
}

export class ReviewCompanyVerificationUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReviewCompanyVerificationInput): Promise<void> {
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    const status: VerificationStatus = input.decision;
    await this.companies.updateVerificationStatus(input.companyId, status);

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.verification.review",
      entityType: "Company",
      entityId: input.companyId,
      metadata: { decision: input.decision, reason: input.reason },
    });

    await this.events.publish({
      type: "CompanyVerificationReviewed",
      payload: { decision: input.decision, reason: input.reason },
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });
  }
}
