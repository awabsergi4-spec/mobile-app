import { prisma } from "@/infrastructure/prisma-client";
import { PrismaServiceCategoryRepository } from "./prisma-service-category.repository";

export const serviceCategoryRepository = new PrismaServiceCategoryRepository(prisma);
