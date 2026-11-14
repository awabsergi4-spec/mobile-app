import { prisma } from "@/infrastructure/prisma-client";
import { PrismaPromotionRepository } from "./prisma-promotion.repository";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { CreatePromotionUseCase } from "@/application/promotion/create-promotion.use-case";
import { UpdatePromotionUseCase } from "@/application/promotion/update-promotion.use-case";
import { SetPromotionActiveUseCase } from "@/application/promotion/set-promotion-active.use-case";

export const promotionRepository = new PrismaPromotionRepository(prisma);

export const createPromotionUseCase = new CreatePromotionUseCase(promotionRepository, auditLogWriter);
export const updatePromotionUseCase = new UpdatePromotionUseCase(promotionRepository, auditLogWriter);
export const setPromotionActiveUseCase = new SetPromotionActiveUseCase(promotionRepository, auditLogWriter);
