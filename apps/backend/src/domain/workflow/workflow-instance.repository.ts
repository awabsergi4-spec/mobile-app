import type { WorkflowInstance, WorkflowInstanceStatus } from "./workflow-instance.entity";

export interface SearchWorkflowInstancesFilter {
  workflowDefinitionId?: string;
  status?: WorkflowInstanceStatus;
  limit?: number;
}

// Interface only — implemented in infrastructure/workflow/prisma-workflow-instance.repository.ts.
// Read-only from the admin UI's perspective: instances are created and
// advanced by the workflow engine's own executor (docs/10-workflow-engine.md),
// never by an admin action — this is an observability surface, not a
// control surface.
export interface WorkflowInstanceRepository {
  findById(id: string): Promise<WorkflowInstance | null>;
  search(filter: SearchWorkflowInstancesFilter): Promise<WorkflowInstance[]>;
}
