// One interface, one implementation per WorkflowActionType — resolved
// through infrastructure/workflow/action-executor-registry.ts, the same
// registry-keyed-by-config shape as AiProviderRegistry/AiRegistry. A step
// executor never knows which workflow definition invoked it.
export interface WorkflowActionContext {
  relatedEntityType: string;
  relatedEntityId: string;
  actionConfig: Record<string, unknown>;
}

export interface WorkflowActionResult {
  success: boolean;
  result?: Record<string, unknown>;
  errorMessage?: string;
}

export interface WorkflowActionExecutor {
  execute(context: WorkflowActionContext): Promise<WorkflowActionResult>;
}
