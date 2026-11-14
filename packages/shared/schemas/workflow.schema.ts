import { z } from "zod";

// Matches WorkflowActionType in apps/backend/prisma/schema.prisma.
export const workflowActionTypeSchema = z.enum([
  "SEND_MESSAGE",
  "CREATE_ESCROW",
  "RELEASE_ESCROW",
  "CREATE_WALLET_TRANSACTION",
  "GENERATE_INVOICE",
  "GENERATE_CONTRACT",
  "ASSIGN_PROVIDER",
  "AI_EVALUATION",
  "FRAUD_CHECK",
  "CREATE_AUDIT_LOG",
  "SCHEDULE_JOB",
  "CALL_EXTERNAL_API",
  "CREATE_ADMIN_TASK",
  "ESCALATE_CASE",
  "GENERATE_REPORT",
]);

export const workflowStepInputSchema = z.object({
  stepKey: z.string().min(1).max(100),
  order: z.number().int().nonnegative(),
  actionType: workflowActionTypeSchema,
  actionConfig: z.record(z.string(), z.unknown()),
  conditionExpression: z.record(z.string(), z.unknown()).optional(),
  timeoutSeconds: z.number().int().positive().optional(),
  maxRetries: z.number().int().nonnegative().optional(),
  retryBackoffSeconds: z.number().int().positive().optional(),
  compensationActionType: workflowActionTypeSchema.optional(),
  compensationConfig: z.record(z.string(), z.unknown()).optional(),
});

export const createWorkflowDefinitionSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(150),
  triggerEventType: z.string().min(1).max(150),
  priority: z.number().int().optional(),
  steps: z.array(workflowStepInputSchema).min(1),
});

export type CreateWorkflowDefinitionPayload = z.infer<typeof createWorkflowDefinitionSchema>;

export const workflowDefinitionStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);
