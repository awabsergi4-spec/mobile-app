import type { WorkflowDefinitionRepository } from "@/domain/workflow/workflow-definition.repository";
import type { WorkflowDefinitionStatus } from "@/domain/workflow/workflow-definition.entity";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";
import { WorkflowDefinitionNotFoundError } from "./errors";

export interface SetWorkflowDefinitionStatusInput {
  workflowDefinitionId: string;
  status: WorkflowDefinitionStatus;
  actorId: string;
}

export class SetWorkflowDefinitionStatusUseCase {
  constructor(
    private readonly workflows: WorkflowDefinitionRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: SetWorkflowDefinitionStatusInput): Promise<void> {
    const existing = await this.workflows.findById(input.workflowDefinitionId);
    if (!existing) {
      throw new WorkflowDefinitionNotFoundError();
    }

    await this.workflows.setStatus(input.workflowDefinitionId, input.status);

    await this.auditLog.write({
      actorId: input.actorId,
      action: "workflow_definition.set_status",
      entityType: "WorkflowDefinition",
      entityId: input.workflowDefinitionId,
      metadata: { status: input.status },
    });
  }
}
