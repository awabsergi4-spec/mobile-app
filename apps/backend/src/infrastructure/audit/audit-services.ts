import { prisma } from "@/infrastructure/prisma-client";
import { PrismaAuditLogReader } from "./prisma-audit-log-reader";

export const auditLogReader = new PrismaAuditLogReader(prisma);
