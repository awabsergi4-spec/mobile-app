import type { WorkflowActionType, WorkflowDefinition, WorkflowDefinitionStatus } from "./workflow-definition.entity";

export interface CreateWorkflowStepInput {
  stepKey: string;
  order: number;
  actionType: WorkflowActionType;
  actionConfig: Record<string, unknown>;
  conditionExpression?: Record<string, unknown>;
  timeoutSeconds?: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
  compensationActionType?: WorkflowActionType;
  compensationConfig?: Record<string, unknown>;
}

export interface CreateWorkflowDefinitionInput {
  key: string;
  name: string;
  triggerEventType: string;
  priority?: number;
  steps: CreateWorkflowStepInput[];
}

export interface SearchWorkflowDefinitionsFilter {
  status?: WorkflowDefinitionStatus;
  limit?: number;
}

// Interface only — implemented in infrastructure/workflow/prisma-workflow-definition.repository.ts.
// Created as DRAFT (schema default) — activating (status: PUBLISHED) is a
// deliberate second step, same pattern as every other admin-authored
// config entity this session (Advertisement, PromotionalCampaign, ...).
export interface WorkflowDefinitionRepository {
  create(input: CreateWorkflowDefinitionInput): Promise<WorkflowDefinition>;
  findById(id: string): Promise<WorkflowDefinition | null>;
  search(filter: SearchWorkflowDefinitionsFilter): Promise<WorkflowDefinition[]>;
  setStatus(id: string, status: WorkflowDefinitionStatus): Promise<void>;
}
