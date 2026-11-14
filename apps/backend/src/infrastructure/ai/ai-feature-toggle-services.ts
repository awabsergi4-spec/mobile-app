import { prisma } from "@/infrastructure/prisma-client";
import { PrismaAiFeatureToggleRepository } from "./prisma-ai-feature-toggle.repository";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { SetAiFeatureToggleUseCase } from "@/application/ai/set-ai-feature-toggle.use-case";

export const aiFeatureToggleRepository = new PrismaAiFeatureToggleRepository(prisma);
export const setAiFeatureToggleUseCase = new SetAiFeatureToggleUseCase(aiFeatureToggleRepository, auditLogWriter);
