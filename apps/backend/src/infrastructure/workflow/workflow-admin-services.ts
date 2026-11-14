import { prisma } from "@/infrastructure/prisma-client";
import { PrismaWorkflowDefinitionRepository } from "./prisma-workflow-definition.repository";
import { PrismaWorkflowInstanceRepository } from "./prisma-workflow-instance.repository";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { CreateWorkflowDefinitionUseCase } from "@/application/workflow/create-workflow-definition.use-case";
import { SetWorkflowDefinitionStatusUseCase } from "@/application/workflow/set-workflow-definition-status.use-case";

export const workflowDefinitionRepository = new PrismaWorkflowDefinitionRepository(prisma);
export const workflowInstanceRepository = new PrismaWorkflowInstanceRepository(prisma);

export const createWorkflowDefinitionUseCase = new CreateWorkflowDefinitionUseCase(workflowDefinitionRepository, auditLogWriter);
export const setWorkflowDefinitionStatusUseCase = new SetWorkflowDefinitionStatusUseCase(workflowDefinitionRepository, auditLogWriter);
