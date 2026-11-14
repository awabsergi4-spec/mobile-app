import type { WorkflowActionType } from "./workflow-definition.entity";

export type WorkflowInstanceStatus = "PENDING" | "RUNNING" | "WAITING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED" | "COMPENSATING" | "COMPENSATED";
export type WorkflowStepExecutionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "RETRYING" | "SKIPPED" | "COMPENSATED";

export interface WorkflowStepExecution {
  id: string;
  workflowInstanceId: string;
  stepId: string;
  stepKey: string;
  actionType: WorkflowActionType;
  status: WorkflowStepExecutionStatus;
  attempt: number;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  result: Record<string, unknown> | null;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowDefinitionName: string;
  definitionVersion: number;
  triggeringEventId: string | null;
  relatedEntityType: string;
  relatedEntityId: string;
  status: WorkflowInstanceStatus;
  currentStepKey: string | null;
  priority: number;
  startedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  stepExecutions: WorkflowStepExecution[];
}
