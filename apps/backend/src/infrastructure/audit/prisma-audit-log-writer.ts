import type { Prisma, PrismaClient } from "@prisma/client";
import type { AuditLogEntry, AuditLogWriter } from "@/domain/audit/audit-log-writer";

export class PrismaAuditLogWriter implements AuditLogWriter {
  constructor(private readonly prisma: PrismaClient) {}

  async write(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress,
      },
    });
  }
}
