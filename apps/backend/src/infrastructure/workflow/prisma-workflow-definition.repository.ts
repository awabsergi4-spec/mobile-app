import type { PrismaClient } from "@prisma/client";
import type { WorkflowDefinition, WorkflowDefinitionStatus } from "@/domain/workflow/workflow-definition.entity";
import type {
  CreateWorkflowDefinitionInput,
  SearchWorkflowDefinitionsFilter,
  WorkflowDefinitionRepository,
} from "@/domain/workflow/workflow-definition.repository";

export class PrismaWorkflowDefinitionRepository implements WorkflowDefinitionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateWorkflowDefinitionInput): Promise<WorkflowDefinition> {
    return this.prisma.workflowDefinition.create({
      data: {
        key: input.key,
        name: input.name,
        triggerEventType: input.triggerEventType,
        priority: input.priority ?? 0,
        steps: {
          create: input.steps.map((step) => ({
            stepKey: step.stepKey,
            order: step.order,
            actionType: step.actionType,
            actionConfig: step.actionConfig as never,
            conditionExpression: step.conditionExpression as never,
            timeoutSeconds: step.timeoutSeconds,
            maxRetries: step.maxRetries ?? 0,
            retryBackoffSeconds: step.retryBackoffSeconds,
            compensationActionType: step.compensationActionType,
            compensationConfig: step.compensationConfig as never,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    }) as unknown as Promise<WorkflowDefinition>;
  }

  async findById(id: string): Promise<WorkflowDefinition | null> {
    return this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: "asc" } } },
    }) as unknown as Promise<WorkflowDefinition | null>;
  }

  async search(filter: SearchWorkflowDefinitionsFilter): Promise<WorkflowDefinition[]> {
    return this.prisma.workflowDefinition.findMany({
      where: { status: filter.status },
      include: { steps: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
    }) as unknown as Promise<WorkflowDefinition[]>;
  }

  async setStatus(id: string, status: WorkflowDefinitionStatus): Promise<void> {
    await this.prisma.workflowDefinition.update({ where: { id }, data: { status } });
  }
}
