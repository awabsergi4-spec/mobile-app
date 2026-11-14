import type { PrismaClient } from "@prisma/client";
import type { WorkflowInstance } from "@/domain/workflow/workflow-instance.entity";
import type { SearchWorkflowInstancesFilter, WorkflowInstanceRepository } from "@/domain/workflow/workflow-instance.repository";

const include = {
  workflowDefinition: { select: { name: true } },
  stepExecutions: {
    include: { step: { select: { stepKey: true, actionType: true } } },
    orderBy: { startedAt: "asc" as const },
  },
};

// Prisma's include shape doesn't match the domain entity 1:1 (nested
// workflowDefinition.name / stepExecutions[].step.* need flattening) — this
// mapper is the only place that knows that.
function toDomain(row: {
  id: string;
  workflowDefinitionId: string;
  workflowDefinition: { name: string };
  definitionVersion: number;
  triggeringEventId: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  status: string;
  currentStepKey: string | null;
  priority: number;
  startedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  stepExecutions: Array<{
    id: string;
    workflowInstanceId: string;
    stepId: string;
    step: { stepKey: string; actionType: string };
    status: string;
    attempt: number;
    startedAt: Date;
    completedAt: Date | null;
    errorMessage: string | null;
    result: unknown;
  }>;
}): WorkflowInstance {
  return {
    id: row.id,
    workflowDefinitionId: row.workflowDefinitionId,
    workflowDefinitionName: row.workflowDefinition.name,
    definitionVersion: row.definitionVersion,
    triggeringEventId: row.triggeringEventId,
    relatedEntityType: row.relatedEntityType,
    relatedEntityId: row.relatedEntityId,
    status: row.status as WorkflowInstance["status"],
    currentStepKey: row.currentStepKey,
    priority: row.priority,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    cancelReason: row.cancelReason,
    stepExecutions: row.stepExecutions.map((se) => ({
      id: se.id,
      workflowInstanceId: se.workflowInstanceId,
      stepId: se.stepId,
      stepKey: se.step.stepKey,
      actionType: se.step.actionType as WorkflowInstance["stepExecutions"][number]["actionType"],
      status: se.status as WorkflowInstance["stepExecutions"][number]["status"],
      attempt: se.attempt,
      startedAt: se.startedAt,
      completedAt: se.completedAt,
      errorMessage: se.errorMessage,
      result: se.result as Record<string, unknown> | null,
    })),
  };
}

export class PrismaWorkflowInstanceRepository implements WorkflowInstanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<WorkflowInstance | null> {
    const row = await this.prisma.workflowInstance.findUnique({ where: { id }, include });
    return row ? toDomain(row) : null;
  }

  async search(filter: SearchWorkflowInstancesFilter): Promise<WorkflowInstance[]> {
    const rows = await this.prisma.workflowInstance.findMany({
      where: { workflowDefinitionId: filter.workflowDefinitionId, status: filter.status },
      include,
      orderBy: { startedAt: "desc" },
      take: filter.limit ?? 50,
    });
    return rows.map(toDomain);
  }
}
