import { prisma } from "@/infrastructure/prisma-client";
import { PrismaAdvertisementRepository } from "./prisma-advertisement.repository";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { CreateAdvertisementUseCase } from "@/application/advertisement/create-advertisement.use-case";
import { UpdateAdvertisementUseCase } from "@/application/advertisement/update-advertisement.use-case";
import { SetAdvertisementActiveUseCase } from "@/application/advertisement/set-advertisement-active.use-case";
import { RecordAdEventUseCase } from "@/application/advertisement/record-ad-event.use-case";

export const advertisementRepository = new PrismaAdvertisementRepository(prisma);

export const createAdvertisementUseCase = new CreateAdvertisementUseCase(advertisementRepository, auditLogWriter);
export const updateAdvertisementUseCase = new UpdateAdvertisementUseCase(advertisementRepository, auditLogWriter);
export const setAdvertisementActiveUseCase = new SetAdvertisementActiveUseCase(advertisementRepository, auditLogWriter);
export const recordAdEventUseCase = new RecordAdEventUseCase(advertisementRepository);
