import type { CompanyRepository } from "@/domain/company/company.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import type { DomainEventPublisher } from "@/domain/workflow/domain-event-publisher";
import { CompanyNotFoundError, InvalidCompanyLifecycleTransitionError } from "./errors";

export interface SuspendCompanyInput {
  companyId: string;
  reason: string;
  actorId: string;
}

// Same shape as SuspendProviderUseCase (ADR-009): state transition owned
// here, DomainEvent published as the additive side effect.
export class SuspendCompanyUseCase {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly auditLog: AuditLogWriter,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute(input: SuspendCompanyInput): Promise<void> {
    const company = await this.companies.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }
    if (company.status === "DELETED") {
      throw new InvalidCompanyLifecycleTransitionError("DELETED", "SUSPENDED");
    }

    await this.companies.updateLifecycleStatus(input.companyId, "SUSPENDED", { reason: input.reason });

    await this.auditLog.write({
      actorId: input.actorId,
      action: "company.suspend",
      entityType: "Company",
      entityId: input.companyId,
      metadata: { reason: input.reason },
    });

    await this.events.publish({
      type: "CompanySuspended",
      payload: { reason: input.reason },
      relatedEntityType: "COMPANY",
      relatedEntityId: input.companyId,
    });
  }
}
