export type WorkflowDefinitionStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export type WorkflowActionType =
  | "SEND_MESSAGE"
  | "CREATE_ESCROW"
  | "RELEASE_ESCROW"
  | "CREATE_WALLET_TRANSACTION"
  | "GENERATE_INVOICE"
  | "GENERATE_CONTRACT"
  | "ASSIGN_PROVIDER"
  | "AI_EVALUATION"
  | "FRAUD_CHECK"
  | "CREATE_AUDIT_LOG"
  | "SCHEDULE_JOB"
  | "CALL_EXTERNAL_API"
  | "CREATE_ADMIN_TASK"
  | "ESCALATE_CASE"
  | "GENERATE_REPORT";

export interface WorkflowStep {
  id: string;
  workflowDefinitionId: string;
  stepKey: string;
  order: number;
  actionType: WorkflowActionType;
  actionConfig: Record<string, unknown>;
  conditionExpression: Record<string, unknown> | null;
  timeoutSeconds: number | null;
  maxRetries: number;
  retryBackoffSeconds: number | null;
  compensationActionType: WorkflowActionType | null;
  compensationConfig: Record<string, unknown> | null;
}

export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  triggerEventType: string;
  version: number;
  status: WorkflowDefinitionStatus;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  steps: WorkflowStep[];
}
