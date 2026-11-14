import type { CompanyRepository } from "@/domain/company/company.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { CompanyNotFoundError, InvalidCompanyLifecycleTransitionError } from "./errors";

export interface DeleteCompanyInput {
  companyId: string;
  actorId: string;
}

// Soft delete only — same reasoning as DeleteProviderUseCase (ADR-008
// financial/audit history integrity).
export class DeleteCompanyUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: DeleteCompanyInput): Promise<void> {
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }
    if (company.status === "DELETED") {
      throw new InvalidCompanyLifecycleTransitionError("DELETED", "DELETED");
    }

    await this.companies.updateLifecycleStatus(input.companyId, "DELETED");

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.delete",
      entityType: "Company",
      entityId: input.companyId,
    });

    await this.events.publish({
      type: "CompanyDeleted",
      payload: {},
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });
  }
}
