import type { CompanyRepository } from "@/domain/company/company.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { CompanyNotFoundError, InvalidCompanyLifecycleTransitionError } from "./errors";

export interface ReactivateCompanyInput {
  companyId: string;
  actorId: string;
}

export class ReactivateCompanyUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: ReactivateCompanyInput): Promise<void> {
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }
    if (company.status === "DELETED") {
      throw new InvalidCompanyLifecycleTransitionError("DELETED", "ACTIVE");
    }

    await this.companies.updateLifecycleStatus(input.companyId, "ACTIVE");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.reactivate",
      entityType: "Company",
      entityId: input.companyId,
    });

    await this.events.publish({
      type: "CompanyReactivated",
      payload: {},
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });
  }
}
