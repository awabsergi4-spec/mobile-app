import { prisma } from "@/infrastructure/prisma-client";
import { PrismaRemoteConfigRepository } from "./prisma-remote-config.repository";
import { auditLogWriter } from "@/infrastructure/provider/provider-services";
import { CreateRemoteConfigEntryUseCase } from "@/application/remote-config/create-remote-config-entry.use-case";
import { UpdateRemoteConfigEntryUseCase } from "@/application/remote-config/update-remote-config-entry.use-case";
import { DeleteRemoteConfigEntryUseCase } from "@/application/remote-config/delete-remote-config-entry.use-case";

export const remoteConfigRepository = new PrismaRemoteConfigRepository(prisma);

export const createRemoteConfigEntryUseCase = new CreateRemoteConfigEntryUseCase(remoteConfigRepository, auditLogWriter);
export const updateRemoteConfigEntryUseCase = new UpdateRemoteConfigEntryUseCase(remoteConfigRepository, auditLogWriter);
export const deleteRemoteConfigEntryUseCase = new DeleteRemoteConfigEntryUseCase(remoteConfigRepository, auditLogWriter);

// Reference lookup for the admin UI's region picker — not a full
// repository since nothing else in this module has Region-specific
// business logic yet, just a read.
export async function listActiveRegions() {
  return prisma.region.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, code: true } });
}
