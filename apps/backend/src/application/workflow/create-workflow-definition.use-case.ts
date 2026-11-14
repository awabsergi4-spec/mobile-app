import type { WorkflowDefinition } from "@/domain/workflow/workflow-definition.entity";
import type { CreateWorkflowDefinitionInput, WorkflowDefinitionRepository } from "@/domain/workflow/workflow-definition.repository";
import type { AuditLogWriter } from "@/domain/audit/audit-log-writer";

export interface CreateWorkflowDefinitionUseCaseInput extends CreateWorkflowDefinitionInput {
  actorId: string;
}

// Created as DRAFT — activating (SetWorkflowDefinitionStatusUseCase) is a
// deliberate second step, so a half-configured definition never starts
// reacting to live DomainEvents.
export class CreateWorkflowDefinitionUseCase {
  constructor(
    private readonly workflows: WorkflowDefinitionRepository,
    private readonly auditLog: AuditLogWriter,
  ) {}

  async execute(input: CreateWorkflowDefinitionUseCaseInput): Promise<WorkflowDefinition> {
    const { actorId, ...rest } = input;
    const definition = await this.workflows.create(rest);

    await this.auditLog.write({
      actorId,
      action: "workflow_definition.create",
      entityType: "WorkflowDefinition",
      entityId: definition.id,
      metadata: { key: definition.key, triggerEventType: definition.triggerEventType, stepCount: definition.steps.length },
    });

    return definition;
  }
}
